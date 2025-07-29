
// export const normalizeChemicalFormula = (chemical: string): string => {
//     if (!chemical.trim()) return '';

//     let result = chemical
//         .replace(/(_\{[^}]+\})/g, '__KEEP_$1__')  // Protect _{ } patterns
//         .replace(/(_\d+)/g, '__KEEP_$1__')        // Protect _digit patterns

//         .replace(/([A-Za-z])(\d+)/g, '$1_{$2}')

//         .replace(/__KEEP_(_\{[^}]+\})__/g, '$1')
//         .replace(/__KEEP_(_\d+)__/g, '$1')

//         .replace(/\s*\+\s*/g, ' + ')

//         .replace(/\s+/g, ' ');

//     return result.trim();
// };
export const factorial = (n: number): number => {
    if (n < 0) {
        throw new Error('Factorial is not defined for negative numbers');
    }
    if (n <= 1) {
        return 1;
    }

    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
};

export const matExp = (matrix: number[][], exp: number): number[][] => {
    if (exp === 0) {
        const size = matrix.length;
        return Array.from({ length: size }, (_, i) =>
            Array.from({ length: size }, (_, j) => i === j ? 1 : 0)
        );
    }
    if (exp === 1) {
        return matrix;
    }

    let result = matrix;
    let base = matrix;
    let power = exp - 1;

    while (power > 0) {
        if (power % 2 === 1) {
            result = matMul(result, base);
        }
        base = matMul(base, base);
        power = Math.floor(power / 2);
    }

    return result;
}

const matMul = (a: number[][], b: number[][]): number[][] => {
    if (!a || !b || a[0].length !== b.length) {
        throw new Error('Incompatible matrix dimensions');
    }

    const rows = a.length;
    const cols = b[0].length;
    const inner = a[0].length;

    const result: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

    // Cache matrix dimensions and use more efficient loop order
    for (let i = 0; i < rows; i++) {
        const aRow = a[i];
        const resultRow = result[i];
        for (let k = 0; k < inner; k++) {
            const aik = aRow[k];
            if (aik !== 0) { // Skip zero multiplications
                const bRow = b[k];
                for (let j = 0; j < cols; j++) {
                    resultRow[j] += aik * bRow[j];
                }
            }
        }
    }

    return result;
}

export const matrixToLatex = (matrix: number[][]): string => {
    if (!matrix || matrix.length === 0) return '';

    const rows = matrix.map(row =>
        row.map(cell => cell.toString()).join(' & ')
    ).join(' \\\\ ');

    return `\\begin{bmatrix} ${rows} \\end{bmatrix}`;
};

export const DAGGER_MATRIX = [
    [0, 0, 0, 0],
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0]
];
export const LOWER_MATRIX = [
    [0, 1, 0, 0],
    [0, 0, 2, 0],
    [0, 0, 0, 3],
    [0, 0, 0, 0]
];


export type ReactionType = 'forward' | 'equilibrium' | 'reverse';

export interface RawElementaryStep {
    id: string;
    reactants: string;
    products: string;
    type: ReactionType;
    forwardRate: string;
    reverseRate: string;
    // secondQuantizedForm: string;
}

export const parseRawElementaryStep = (step: RawElementaryStep): ParsedStep => {
    const parseInput = (input: string): Species[] => {
        if (!input.trim()) {
            return [];
        }
        return input.split('+').map(species => {
            const trimmed = species.trim();

            const match = trimmed.match(/^(\d+)(.+)$/);

            let coeff: number;
            let name: string;

            if (match) {
                coeff = parseInt(match[1]);
                name = match[2].trim();
            } else {
                coeff = 1;
                name = trimmed;
            }

            return { name, coeff };
        }).filter(species => species.name.trim() !== ''); // Filter out empty species names
    };

    const reactants = parseInput(step.reactants);
    const products = parseInput(step.products);

    return {
        reactants,
        products,
        rate: step.forwardRate.trim(),
    }
}

export interface Species {
    name: string,
    coeff: number,
}

export interface ParsedStep {
    reactants: Species[],
    products: Species[],
    rate: string,
}

export const formatReactionEquation = (step: RawElementaryStep): string => {
    const normalizedReactants = step.reactants;
    const normalizedProducts = step.products;

    let arrow: string;
    let forwardRate = step.forwardRate ? step.forwardRate.trim() : 'k_f';
    let backwardRate = step.reverseRate ? step.reverseRate.trim() : 'k_r';

    switch (step.type) {
        case 'forward':
            arrow = `->[$${forwardRate}$]`;
            break;
        case 'equilibrium':
            arrow = `<=>[$${forwardRate}$][$${backwardRate}$]`;
            break;
        case 'reverse':
            arrow = `<-[$${backwardRate}$]`;
            break;
    }

    let res = `\\ce{${normalizedReactants} ${arrow} ${normalizedProducts}}`;
    // console.log('Formatted reaction equation:', res);
    return res;
};

export const formatRateConstant = (type: 'forward' | 'reverse', value: string): string => {
    const subscript = type === 'forward' ? 'f' : 'r';
    return `k_{${subscript}} = ${value}`;
};

const stepToKaTeX = (step: ParsedStep, context: 'preview' | 'visualization' = 'preview', subscript?: 'f' | 'r', stepIndex?: number): string => {
    const species: string[] = [];
    step.reactants.forEach(sp => {
        if (!species.includes(sp.name)) species.push(sp.name);
    });
    step.products.forEach(sp => {
        if (!species.includes(sp.name)) species.push(sp.name);
    });

    // const eta = species.map(name => {
    //     const s = step.reactants.find(r => r.name === name);
    //     return s ? s.coeff : 0;
    // });
    // const mu = species.map(name => {
    //     const s = step.products.find(p => p.name === name);
    //     return s ? s.coeff : 0;
    // });

    const format = (name: string, exp: number, dagger: boolean): string => {
        if (exp === 0) return "";
        // FIXME: Can we have the dataset and class terms at the same level?

        return `\\htmlClass{clickable}{\\htmlData{dagger=${dagger}, exponent=${exp}}{x^{${dagger ? "\\dagger" : ""} ${(exp > 1) ? String(exp) : ""}}_{\\tiny \\ce{${name}}}}}`;
        // if (exp === 1) {
        //     return dagger ? `x^{\\dagger}_{\\tiny ${name}} ` : `x^{}_{\\tiny ${name}} `;
        // } else {
        //     return phantom ? `x^{${exp}}_{\\tiny ${name}} ` : `x^{\\dagger ${exp}}_{\\tiny ${name}} `;
        // }
        // return n === 1 ? sym : `${sym}^{${n}}`;
    }

    const gain =
        step.products.map((species) =>
            format(species.name, species.coeff, true)
        )
            .filter(Boolean)
            .join(" ") + " " +
        step.reactants
            .map((species) =>
                format(species.name, species.coeff, false)
            )
            .filter(Boolean)
            .join(" ");


    const loss = step.reactants
        .map((species) =>
            format(species.name, species.coeff, true) +
            format(species.name, species.coeff, false)
        )
        .filter(Boolean)
        .join(" ")

    // const loss = species
    //         .map((s, i) =>
    //             format(s, eta[i], false)  // Dagger terms first 
    //             +
    //             format(s, eta[i], true)   // Non-dagger terms second
    //         )
    //         // .filter(Boolean)
    //         .join(" ");

    // console.log('Gain:', gain);
    // console.log('Loss:', loss);

    // const gain = species
    //     .map((s, i) =>
    //         factor(`x^{\\dagger}_{\\tiny ${s}}`, mu[i]) +  // Create products
    //         factor(`x^{\\vphantom{\\dagger}}_{\\tiny ${s}}`, 0)  // No annihilation in gain
    //     )
    //     .filter(Boolean)
    //     .join("");

    // const loss = species
    //     .map((s, i) =>
    //         factor(`x^{\\dagger}_{\\tiny ${s}}`, 0) +  // No creation in loss  
    //         factor(`x^{\\vphantom{\\dagger}}_{\\tiny ${s}}`, eta[i])  // Annihilate reactants
    //     )
    //     .filter(Boolean)
    //     .join("");

    // const G = gain || "1";
    // const L = loss || "1";

    let combinatorial_term = 1;
    step.reactants.forEach(species => {
        if (species.coeff > 1) {
            combinatorial_term *= factorial(species.coeff);
        }
    });

    let wPrefix = '';
    if (context === 'preview') {
        if (subscript) {
            wPrefix = `\\mathbb{W}_{${subscript}} =\\;`;
        } else {
            wPrefix = `\\mathbb{W} =\\;`;
        }
    } else if (context === 'visualization') {
        if (stepIndex !== undefined) {
            if (subscript) {
                wPrefix = `\\mathbb{W}_{${stepIndex + 1},${subscript}} =\\;`;
            } else {
                wPrefix = `\\mathbb{W}_{${stepIndex + 1}} =\\; `;
            }
        } else {
            wPrefix = `\\mathbb{W} =\\; `;
        }
    }

    return `{${wPrefix}} ${combinatorial_term > 1 ? `\\tfrac{${step.rate}}{${combinatorial_term}}` : ""} \\bigl[ ${gain} - ${loss} \\bigr]`;
}


export const formatSecondQuantizedForm = (step: RawElementaryStep, context: 'preview' | 'visualization' = 'preview', stepIndex?: number): string | { forward: string, backward: string } => {
    const parsed = parseRawElementaryStep(step);

    if (step.type === 'equilibrium') {
        const forwardForm = stepToKaTeX(parsed, context, 'f', stepIndex);

        const backwardParsed: ParsedStep = {
            reactants: parsed.products,
            products: parsed.reactants,
            rate: step.reverseRate.trim() || 'k_r'
        };
        const backwardForm = stepToKaTeX(backwardParsed, context, 'r', stepIndex);

        return { forward: forwardForm, backward: backwardForm };
    } else {
        return stepToKaTeX(parsed, context, undefined, stepIndex);
    }
};