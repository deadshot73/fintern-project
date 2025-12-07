import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export default function AgentLatex({ latex }) {
  try {
    // Clean the LaTeX text - remove \[ and \] delimiters if present
    let cleanLatex = latex;
    if (cleanLatex.startsWith('\\[') && cleanLatex.endsWith('\\]')) {
      cleanLatex = cleanLatex.slice(2, -2).trim();
    }
    
    console.log('🧮 AgentLatex received:', latex);
    console.log('🧮 Cleaned LaTeX:', cleanLatex);
    
    return (
      <div className="bg-light p-2 rounded text-start me-auto" style={{ maxWidth: '75%' }}>
        <BlockMath math={cleanLatex} />
      </div>
    );
  } catch (err) {
    console.error('[AgentLatex] Invalid LaTeX:', latex, err.message);
    return (
      <div className="bg-warning text-dark p-2 rounded text-start me-auto" style={{ maxWidth: '75%' }}>
        Error rendering LaTeX: {latex}
      </div>
    );
  }
}
