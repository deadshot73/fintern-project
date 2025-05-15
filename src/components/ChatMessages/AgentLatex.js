import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export default function AgentLatex({ latex }) {
  try {
    return (
      <div className="bg-light p-2 rounded text-start me-auto" style={{ maxWidth: '75%' }}>
        <BlockMath math={latex} />
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
