import { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import "katex/dist/katex.min.css"
import "katex/dist/contrib/mhchem.mjs";
import { DAGGER_MATRIX, LOWER_MATRIX, matExp, matrixToLatex } from './utils';

interface LatexRendererProps {
    latex: string;
    className?: string;
}

const MatrixTooltip: React.FC<{ dagger: boolean; exp: number; className?: string }> = ({ dagger, exp, className = '' }) => {
    const tooltipRef = useRef<HTMLSpanElement>(null);

    const matrix_raised = dagger ? DAGGER_MATRIX : LOWER_MATRIX;
    const res = matExp(matrix_raised, exp);
    const latex = matrixToLatex(res);


    useEffect(() => {
        if (tooltipRef.current) {
            try {
                katex.render(latex, tooltipRef.current, {
                    throwOnError: true,
                    strict: false,
                    displayMode: true,
                    trust: true,
                });
            } catch (error) {
                // console.warn('Matrix tooltip LaTeX rendering failed:', latex, error);
                // if (tooltipRef.current) {
                //     tooltipRef.current.textContent = latex;
                // }

                // Red incorrect latex rendering warning text
                console.warn('Matrix tooltip LaTeX rendering failed:', latex, error);
                tooltipRef.current!.textContent = "LaTeX rendering failed";
                tooltipRef.current!.style.color = 'red'; // Set text color to red
            }
        }
    }, [latex]);

    return <span ref={tooltipRef} className={className} />;
};

const LatexRenderer: React.FC<LatexRendererProps> = ({ latex, className = '' }) => {
    const containerRef = useRef<HTMLSpanElement>(null);
    const [hoveredElement, setHoveredElement] = useState<{ element: HTMLElement; isDagger: boolean; x: number; y: number, exp: number } | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            try {
                katex.render(latex, containerRef.current, {
                    throwOnError: true,
                    // errorColor: '#000', 
                    strict: false,
                    displayMode: true,
                    trust: true,
                });

                const clickableElements = containerRef.current.querySelectorAll('.clickable');
                clickableElements.forEach((element) => {
                    const htmlElement = element as HTMLElement;

                    const handleMouseEnter = (e: MouseEvent) => {
                        const target = e.target as HTMLElement;
                        const rect = target.getBoundingClientRect();

                        // const textContent = target.textContent || '';
                        // const innerHTML = target.innerHTML || '';

                        // const isDagger = textContent.includes('†') || innerHTML.includes('†');
                        // FIXME: Can we have the dataset and class terms at the same level?
                        const dataset = (target.firstElementChild as HTMLElement)?.dataset;
                        const exp: number = dataset.exponent ? parseInt(dataset.exponent, 10) : 1;
                        const isDagger = dataset.dagger === 'true';
                        // console.log('Hovered element:', target, 'isDagger:', isDagger);
                        // || textContent.includes('†') || innerHTML.includes('†');

                        setHoveredElement({
                            element: target,
                            exp,
                            isDagger: !!isDagger,
                            x: rect.left + rect.width / 2,
                            y: rect.top
                        });
                    };

                    const handleMouseLeave = () => {
                        setHoveredElement(null);
                    };

                    htmlElement.addEventListener('mouseenter', handleMouseEnter);
                    htmlElement.addEventListener('mouseleave', handleMouseLeave);

                    return () => {
                        htmlElement.removeEventListener('mouseenter', handleMouseEnter);
                        htmlElement.removeEventListener('mouseleave', handleMouseLeave);
                    };
                });
            }
            catch (error) {
                console.warn('LaTeX rendering failed for:', latex, error);
                containerRef.current!.textContent = "LaTeX rendering failed";
                containerRef.current.style.color = 'red'; // Set text color to red
                containerRef.current.style.fontStyle = 'italic'; // Optional: Adjust font size for better visibility
                // containerRef.current.style.fontSize = '0.75em'; // Optional: Adjust font size for better visibility
            }
        }
    }, [latex]);
    // const daggerMatrix = String.raw`\begin{bmatrix} 0 & 0 & 0 \\ 1 & 0 & 0 \\ 0 & 1 & 0 \end{bmatrix}`; // Creation operator
    // const nonDaggerMatrix = String.raw`\begin{bmatrix} 0 & 1 & 0 \\ 0 & 0 & 2 \\ 0 & 0 & 0 \end{bmatrix}`; // Annihilation operator

    return (
        <>
            <span ref={containerRef} className={className} />
            {hoveredElement && (
                <div
                    className="matrix-tooltip"
                    style={{
                        position: 'fixed',
                        left: hoveredElement.x,
                        top: hoveredElement.y - 10,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 1000,
                        pointerEvents: 'none'
                    }}
                >
                    <MatrixTooltip
                        dagger={hoveredElement.isDagger}
                        exp={hoveredElement.exp} // Assuming exponent is always 1 for the tooltip
                        className="matrix-tooltip-content"
                    />
                </div>
            )}
        </>
    );
};

export default LatexRenderer;
