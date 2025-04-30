import { stackoverflowDark} from 'react-syntax-highlighter/dist/esm/styles/hljs';
import SyntaxHighlighter from 'react-syntax-highlighter';

export default function ShowCodeBlock({lang, code}) {

    return (
      
      <SyntaxHighlighter language={lang.toLowerCase()} style={stackoverflowDark} customStyle={{ fontSize: '12px' }}>
        {code}
      </SyntaxHighlighter>);
}