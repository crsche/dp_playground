import { useState, useEffect } from 'react'
import './App.css'
import { formatReactionEquation, formatSecondQuantizedForm, type RawElementaryStep, type ReactionType } from './utils'

import 'katex/dist/katex.min.css'
import "katex/dist/contrib/mhchem.mjs";
import LatexRenderer from './LatexRenderer'

const STORAGE_KEYS = {
  STEPS: 'elementary-steps',
  CURRENT_STEP: 'current-elementary-step'
};

const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const loadFromStorage = function <T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
};






const SecondQuantizedRenderer: React.FC<{
  step: RawElementaryStep;
  context?: 'preview' | 'visualization';
  stepIndex?: number;
}> = ({ step, context = 'preview', stepIndex }) => {
  const secondQuantizedForm = formatSecondQuantizedForm(step, context, stepIndex);

  if (typeof secondQuantizedForm === 'string') {
    return (
      <LatexRenderer
        latex={secondQuantizedForm}
        className="latex-equation"
      />
    );
  } else {
    const forwardLabel = context === 'preview' ? 'Forward:' : 'Forward:';
    const reverseLabel = context === 'preview' ? 'Reverse:' : 'Reverse:';

    return (
      <div className="equilibrium-forms">
        <div className="equilibrium-scroll-container">
          <div className="equilibrium-form">
            <span className="form-label">{forwardLabel}</span>
            <LatexRenderer
              latex={secondQuantizedForm.forward}
              className="latex-equation"
            />
          </div>
          <div className="equilibrium-form">
            <span className="form-label">{reverseLabel}</span>
            <LatexRenderer
              latex={secondQuantizedForm.backward}
              className="latex-equation"
            />
          </div>
        </div>
      </div>
    );
  }
};

function App() {
  const [steps, setSteps] = useState<RawElementaryStep[]>(() =>
    loadFromStorage(STORAGE_KEYS.STEPS, [])
  );

  const [currentStep, setCurrentStep] = useState<RawElementaryStep>(() =>
    loadFromStorage(STORAGE_KEYS.CURRENT_STEP, {
      id: '',
      reactants: 'A + B',
      products: 'C + D',
      type: 'forward' as ReactionType,
      forwardRate: 'c_f',
      reverseRate: 'c_r',
    })
  );

  const [idCounter, setIdCounter] = useState(() => Date.now());

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.STEPS, steps);
  }, [steps]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CURRENT_STEP, currentStep);
  }, [currentStep]);

  const cycleReactionType = () => {
    const typeOrder: ReactionType[] = ['forward', 'equilibrium', 'reverse'];
    const currentIndex = typeOrder.indexOf(currentStep.type);
    const nextIndex = (currentIndex + 1) % typeOrder.length;
    setCurrentStep({
      ...currentStep,
      type: typeOrder[nextIndex]
    });
  };

  const getArrowSymbol = (type: ReactionType) => {
    switch (type) {
      case 'forward': return '→';
      case 'equilibrium': return '⇌';
      case 'reverse': return '←';
    }
  };

  const addStep = () => {
    if (currentStep.reactants.trim() && currentStep.products.trim() && currentStep.forwardRate.trim()) {
      const newStep = {
        ...currentStep,
        id: `step-${idCounter}`
      };
      setSteps([...steps, newStep]);
      setIdCounter(prev => prev + 1);
      setCurrentStep(currentStep);
    }
  };

  const deleteStep = (id: string) => {
    setSteps(prevSteps => prevSteps.filter(step => step.id !== id));
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h3 className="title">Reaction Network Builder</h3>
          {/* <p className="subtitle">Define elementary reaction steps</p> */}
        </header>
        {/* <LatexRenderer
          latex={String.raw`E = m c^2 \quad \htmlClass{clickable}{m} \; c^2`}
        /> */}

        <div className="main-content">
          <div className="step-builder">
            <h2 className="form-title">Add Elementary Step</h2>

            <div className="reaction-builder">
              <div className="reactants-section">
                <textarea
                  className="species-input reactants-input"
                  placeholder="A + B"
                  value={currentStep.reactants}
                  onChange={(e) => setCurrentStep({ ...currentStep, reactants: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="arrow-section">
                <div className={`arrow-button-container ${(currentStep.type === 'forward' || currentStep.type === 'equilibrium') ? 'has-top-input' : ''
                  } ${(currentStep.type === 'reverse' || currentStep.type === 'equilibrium') ? 'has-bottom-input' : ''
                  }`}>
                  <div className="rate-input-container rate-above">
                    {(currentStep.type === 'forward' || currentStep.type === 'equilibrium') ? (
                      <div className="rate-input-group">
                        {/* <label className="rate-label">
                          <LatexRenderer latex="k_f" className="latex-label" />
                        </label> */}
                        <input
                          type="text"
                          className="rate-input"
                          placeholder="c_f"
                          value={currentStep.forwardRate}
                          onChange={(e) => setCurrentStep({ ...currentStep, forwardRate: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div className="rate-input-placeholder"></div>
                    )}
                  </div>

                  <button
                    className="arrow-button"
                    onClick={cycleReactionType}
                    title="Click to cycle between forward, equilibrium, and reverse reactions"
                  >
                    {getArrowSymbol(currentStep.type)}
                  </button>

                  <div className="rate-input-container rate-below">
                    {(currentStep.type === 'reverse' || currentStep.type === 'equilibrium') ? (
                      <div className="rate-input-group">
                        <input
                          type="text"
                          className="rate-input"
                          placeholder="k_r"
                          value={currentStep.reverseRate}
                          onChange={(e) => setCurrentStep({ ...currentStep, reverseRate: e.target.value })}
                        />
                        {/* <label className="rate-label">
                          <LatexRenderer latex="k_r" className="latex-label" />
                        </label> */}
                      </div>
                    ) : (
                      <div className="rate-input-placeholder"></div>
                    )}
                  </div>
                </div>
              </div>

              <div className="products-section">
                <textarea
                  className="species-input products-input"
                  placeholder="C + D"
                  value={currentStep.products}
                  onChange={(e) => setCurrentStep({ ...currentStep, products: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="equation-preview">
              <h3 className="preview-title">Preview:</h3>
              <div className="preview-equation">
                <LatexRenderer
                  latex={formatReactionEquation(currentStep)}
                  className="latex-equation"
                />
              </div>
            </div>

            {/* <div className="second-quantized-input">
              <h3 className="form-subtitle">Second-Quantized Form (Optional):</h3>
              <textarea
                className="second-quantized-textarea"
                placeholder="Enter LaTeX for second-quantized form (e.g., \hat{H} = \sum_{i,j} t_{ij} \hat{a}^\dagger_i \hat{a}_j)"
                value={currentStep.secondQuantizedForm}
                onChange={(e) => setCurrentStep({ ...currentStep, secondQuantizedForm: e.target.value })}
                rows={3}
              />
            </div> */}

            <div className="equation-preview">
              <h3 className="preview-title">Second-Quantized Form:</h3>
              <div className="preview-equation">
                <SecondQuantizedRenderer step={currentStep} />
              </div>
            </div>

            <button
              className="add-step-btn"
              onClick={addStep}
              disabled={!currentStep.reactants.trim() || !currentStep.products.trim() || !currentStep.forwardRate.trim()}
            >
              Add Elementary Step
            </button>
          </div>

          <div className="steps-list">
            <h2 className="form-title">Reaction Mechanism ({steps.length} steps)</h2>

            {steps.length === 0 ? (
              <div className="empty-state">
                <p>No elementary steps added yet.</p>
                <p>Build your reaction mechanism by adding steps above.</p>
              </div>
            ) : (
              <div className="steps-container">
                {steps.map((step, index) => (
                  <div key={step.id} className="step-card">
                    <div className="step-header">
                      <span className="step-number">Step {index + 1}</span>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStep(step.id);
                        }}
                        title="Delete this step"
                      >×</button>
                    </div>

                    <div className="step-equation">
                      <LatexRenderer
                        latex={formatReactionEquation(step)}
                        className="latex-equation"
                      />
                    </div>

                    <div className="step-second-quantized">
                      <SecondQuantizedRenderer
                        step={step}
                        context="visualization"
                        stepIndex={index}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
