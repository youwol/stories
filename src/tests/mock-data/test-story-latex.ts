export let contentLatex = `
# Latex equations

You can find more example [here](https://fr.overleaf.com/learn/latex/Mathematical_expressions)
and [here](https://math.meta.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference)

Latex equations can be embedded in your document, some examples:

$$x=2$$

$$\\sqrt{x^2+1}$$

$$x^2 + y^2 = z^2$$

$$E=mc^2$$

Greek letters

$$\\alpha \\beta \\gamma \\rho \\sigma \\delta \\epsilon$$

Binary operators

$$\\times \\otimes \\oplus \\cup \\cap$$

Relation operators
$$< > \\subset \\supset \\subseteq \\supseteq$$

Others
$$\\int \\oint \\sum \\prod$$

$$ \\int\\limits_0^1 x^2 + y^2 \\ dx$$
$$\\int_0^1 x^2 + y^2 \\ dx$$
$$\\sum_{i=1}^{\\infty} \\frac{1}{n^s} 
= \\prod_p \\frac{1}{1 - p^{-s}}$$
$$a_{n_i}$$
$$\\int_{i=1}^n$$
$$\\sum_{i=1}^{\\infty}$$
$$\\prod_{i=1}^n$$
$$\\cup_{i=1}^n$$
$$\\cap_{i=1}^n$$
$$\\oint_{i=1}^n$$
$$\\coprod_{i=1}^n$$

$$\\iint_V \\mu(u,v) \\,du\\,dv$$
$$\\iiint_V \\mu(u,v,w) \\,du\\,dv\\,dw$$
$$\\iiiint_V \\mu(t,u,v,w) \\,dt\\,du\\,dv\\,dw$$
$$\\idotsint_V \\mu(u_1,\\dots,u_k) \\,du_1 \\dots du_k$$
$$\\lim_{x\\to\\infty} f(x)$$

$$\\binom{n}{k} = \\frac{n!}{k!(n-k)!}$$

$$a_0+\\cfrac{1}{a_1+\\cfrac{1}{a_2+\\cfrac{1}{a_3+\\cdots}}}$$

$$\\sin(a + b) = \\sin a \\cos b + \\cos b \\sin a$$

## Complete list of operators

$$\\cos$$
$$\\csc$$
$$\\exp$$
$$\\ker$$
$$\\limsup$$
$$\\min$$
$$\\sinh$$
$$\\arcsin$$
$$\\cosh$$
$$\\deg$$
$$\\gcd$$
$$\\lg$$
$$\\ln$$
$$\\Pr$$
$$\\sup$$
$$\\arctan$$
$$\\cot$$
$$\\det$$
$$\\hom$$
$$\\lim$$
$$\\log$$
$$\\sec$$
$$\\tan$$
$$\\arg$$
$$\\coth$$
$$\\dim$$
$$\\liminf$$
$$\\max$$
$$\\sin$$
$$\\tanh$$

## Brackets & parenthesis

$$\\big( \\Big( \\bigg( \\Bigg($$
$$\\big] \\Big] \\bigg] \\Bigg]$$
$$\\big\\{ \\Big\\{ \\bigg\\{ \\Bigg\\{$$
$$\\big \\langle \\Big \\langle \\bigg \\langle \\Bigg \\langle$$
$$\\big\\| \\Big\\| \\bigg\\| \\Bigg\\|$$
$$\\big \\lceil \\Big \\lceil \\bigg \\lceil \\Bigg \\lceil$$
$$\\big \\lfloor \\Big \\lfloor \\bigg \\lfloor \\Bigg \\lfloor$$

## Matrixes

$$\\begin{pmatrix}
a & b \\\\\\ 
c & d
\\end{pmatrix}$$

$$\\begin{bmatrix}
a & b \\\\\\ 
c & d
\\end{bmatrix}$$

$$\\begin{Bmatrix}
a & b \\\\\\ 
c & d
\\end{Bmatrix}$$

$$\\begin{vmatrix}
a & b \\\\\\ 
c & d
\\end{vmatrix}$$

$$\\begin{Vmatrix}
a & b \\\\\\ 
c & d
\\end{Vmatrix}$$

$$
A=\\begin{pmatrix}
a_{11} & a_{12} & \\dots & a_{1n} \\\\\\ 
a_{21} & a_{22} & \\dots & a_{2n} \\\\\\ 
\\vdots & \\vdots & \\ddots & \\vdots \\\\\\  
a_{m1} & a_{m2} & \\dots & a_{mn}
\\end{pmatrix}
$$

## Aligned equations
Often people want a series of equations where the equals signs are aligned. 

$$
\\begin{align}
\\sqrt{37} & = \\sqrt{\\frac{73^2-1}{12^2}} \\\\\\ 
 & = \\sqrt{\\frac{73^2}{12^2}\\cdot\\frac{73^2-1}{73^2}} \\\\\\  
 & = \\sqrt{\\frac{73^2}{12^2}}\\sqrt{\\frac{73^2-1}{73^2}} \\\\\\ 
 & = \\frac{73}{12}\\sqrt{1 - \\frac{1}{73^2}} \\\\\\  
 & \\approx \\frac{73}{12}\\left(1 - \\frac{1}{2\\cdot73^2}\\right)
\\end{align}
$$

Each line should end with \\\\\\ , and should contain an ampersand at the point to align at, 
typically immediately before the equals sign.

## Defining by case 

You can defined by case:
$$f(n) =
\\begin{cases}
n/2,  & \\text{if $n$ is even} \\\\\\ 
3n+1, & \\text{if $n$ is odd}
\\end{cases}
$$


`