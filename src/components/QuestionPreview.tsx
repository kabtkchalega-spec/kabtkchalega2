import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface QuestionPreviewProps {
  question: {
    question_statement: string;
    options?: string[];
    answer?: string;
    solution?: string;
    question_type: string;
  };
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({ question }) => {
  const renderMathContent = (content: string, forceBlock = false) => {
    if (!content) return null;

    // Handle different LaTeX delimiters and patterns
    // First, normalize common LaTeX patterns
    let normalizedContent = content
      // Handle \begin{cases} and \end{cases}
      .replace(/\\begin\{cases\}/g, '\\begin{cases}')
      .replace(/\\end\{cases\}/g, '\\end{cases}')
      // Handle \text{} properly
      .replace(/\\text\{([^}]*)\}/g, '\\text{$1}')
      // Handle \neq, \leq, \geq
      .replace(/\\neq/g, '\\neq')
      .replace(/\\leq/g, '\\leq')
      .replace(/\\geq/g, '\\geq')
      // Handle \lim with proper spacing
      .replace(/\\lim_\{([^}]*)\}/g, '\\lim_{$1}')
      // Handle \frac properly
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '\\frac{$1}{$2}')
      // Handle \sin, \cos, \tan, etc.
      .replace(/\\(sin|cos|tan|log|ln|exp|sqrt)\b/g, '\\$1')
      // Handle \cdot for multiplication
      .replace(/\\cdot/g, '\\cdot')
      // Handle line breaks in math
      .replace(/\\\\/g, '\\\\')
      // Handle alignment characters
      .replace(/&/g, '&');

    // If it's a long mathematical expression or contains cases/align, treat as block
    const shouldBeBlock = forceBlock || 
      normalizedContent.includes('\\begin{cases}') ||
      normalizedContent.includes('\\begin{align}') ||
      normalizedContent.includes('\\begin{array}') ||
      normalizedContent.includes('\\\\') ||
      normalizedContent.length > 100;

    // Split content by math delimiters, including display math
    const parts = normalizedContent.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[\s\S]*?\$)/);
    
    return parts.map((part, index) => {
      if ((part.startsWith('$$') && part.endsWith('$$')) || 
          (part.startsWith('\\[') && part.endsWith('\\]'))) {
        // Block math
        const mathContent = part.startsWith('$$') ? part.slice(2, -2) : part.slice(2, -2);
        try {
          return <BlockMath key={index} math={mathContent} />;
        } catch (error) {
          console.error('BlockMath rendering error:', error, 'Content:', mathContent);
          return <span key={index} className="text-red-500 font-mono">{part}</span>;
        }
      } else if ((part.startsWith('$') && part.endsWith('$')) || 
                 (part.startsWith('\\(') && part.endsWith('\\)'))) {
        // Inline math
        const mathContent = part.startsWith('$') ? part.slice(1, -1) : part.slice(2, -2);
        try {
          // If content should be block but is marked as inline, render as block
          if (shouldBeBlock && mathContent.length > 50) {
            return <BlockMath key={index} math={mathContent} />;
          }
          return <InlineMath key={index} math={mathContent} />;
        } catch (error) {
          console.error('InlineMath rendering error:', error, 'Content:', mathContent);
          return <span key={index} className="text-red-500 font-mono">{part}</span>;
        }
      } else {
        // Regular text - handle line breaks
        const textParts = part.split('\n');
        return (
          <span key={index}>
            {textParts.map((textPart, textIndex) => (
              <React.Fragment key={textIndex}>
                {textPart}
                {textIndex < textParts.length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      }
    });
  };

  // Special handling for questions that are entirely mathematical
  const renderMathQuestion = (content: string) => {
    // If the entire content looks like it should be math, wrap it
    if (content.includes('\\') && !content.includes('$')) {
      // Likely raw LaTeX without delimiters
      try {
        return <BlockMath math={content} />;
      } catch (error) {
        console.error('Math question rendering error:', error);
        return renderMathContent(content, true);
      }
    }
    return renderMathContent(content);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
            {question.question_type}
          </span>
        </div>
        
        <div className="text-gray-900 mb-4 leading-relaxed">
          <strong>Question:</strong>
          <div className="mt-2">
            {renderMathQuestion(question.question_statement)}
          </div>
        </div>

        {question.options && question.options.length > 0 && (
          <div className="mb-4">
            <strong>Options:</strong>
            <div className="mt-2 space-y-3">
              {question.options.map((option, index) => (
                <div key={index} className="flex items-start gap-3 leading-relaxed">
                  <span className="font-medium text-gray-600">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <div className="flex-1">{renderMathContent(option)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {question.answer && (
          <div className="mb-4">
            <strong>Answer:</strong>
            <div className="mt-2 text-green-700 font-medium leading-relaxed">
              {renderMathContent(question.answer)}
            </div>
          </div>
        )}

        {question.solution && (
          <div>
            <strong>Solution:</strong>
            <div className="mt-2 text-gray-700 leading-relaxed space-y-2">
              {renderMathContent(question.solution, true)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionPreview;