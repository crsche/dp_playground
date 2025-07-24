import { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import "katex/dist/katex.min.css"
import "katex/dist/contrib/mhchem.mjs";

interface LatexRendererProps {
    latex: string;
    className?: string;
}

const MatrixTooltip: React.FC<{ latex: string; className?: string }> = ({ latex, className = '' }) => {
    const tooltipRef = useRef<HTMLSpanElement>(null);

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
                console.warn('Matrix tooltip LaTeX rendering failed:', latex, error);
                if (tooltipRef.current) {
                    tooltipRef.current.textContent = latex;
                }
            }
        }
    }, [latex]);

    return <span ref={tooltipRef} className={className} />;
};

const LatexRenderer: React.FC<LatexRendererProps> = ({ latex, className = '' }) => {
    const containerRef = useRef<HTMLSpanElement>(null);
    const [hoveredElement, setHoveredElement] = useState<{ element: HTMLElement; isDagger: boolean; x: number; y: number } | null>(null);

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

                        const textContent = target.textContent || '';
                        const innerHTML = target.innerHTML || '';

                        const isDagger = textContent.includes('†') || innerHTML.includes('†');

                        setHoveredElement({
                            element: target,
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
                if (containerRef.current) {
                    containerRef.current.textContent = latex;
                }
            }
        }
    }, [latex]);
    const daggerMatrix = String.raw`\left[\begin{matrix} 0 & 0 & 0 \\ 1 & 0 & 0 \\ 0 & 1 & 0 \end{matrix}\right]`; // Creation operator
    const nonDaggerMatrix = String.raw`\left[\begin{matrix} 0 & 1 & 0 \\ 0 & 0 & 2 \\ 0 & 0 & 0 \end{matrix}\right]`; // Annihilation operator

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
                        latex={hoveredElement.isDagger ? daggerMatrix : nonDaggerMatrix}
                        className="matrix-tooltip-content"
                    />
                </div>
            )}
        </>
    );
};

export default LatexRenderer;
