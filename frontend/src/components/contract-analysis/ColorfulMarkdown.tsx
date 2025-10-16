'use client';

import ReactMarkdown from 'react-markdown';

export const ColorfulMarkdownComponents = {
  h1: ({children}: any) => <h1 className="text-3xl font-bold text-red-600 mt-6 mb-4">{children}</h1>,
  h2: ({children}: any) => <h2 className="text-2xl font-bold text-red-600 mt-5 mb-3">{children}</h2>,
  h3: ({children}: any) => <h3 className="text-xl font-semibold text-red-500 mt-4 mb-2">{children}</h3>,
  h4: ({children}: any) => <h4 className="text-lg font-semibold text-red-500 mt-3 mb-2">{children}</h4>,
  h5: ({children}: any) => <h5 className="font-semibold text-red-500 mt-3 mb-2">{children}</h5>,
  h6: ({children}: any) => <h6 className="font-semibold text-red-500 mt-3 mb-2">{children}</h6>,
  strong: ({children}: any) => <strong className="font-bold text-red-600">{children}</strong>,
  em: ({children}: any) => <em className="italic text-blue-600">{children}</em>,
  code: ({children, inline}: any) => 
    <code className="bg-gray-100 text-green-700 px-2 py-1 rounded text-sm font-mono">{children}</code>,
  pre: ({children}: any) => <pre className="bg-gray-100 text-green-800 p-4 rounded-lg overflow-x-auto border border-gray-300 my-2 font-mono text-sm">{children}</pre>,
  blockquote: ({children}: any) => <blockquote className="border-l-4 border-red-500 pl-4 py-2 italic text-gray-700 bg-gray-50 p-3 rounded my-2">{children}</blockquote>,
  ul: ({children}: any) => <ul className="list-disc ml-6 text-gray-800 my-2 space-y-1">{children}</ul>,
  ol: ({children}: any) => <ol className="list-decimal ml-6 text-gray-800 my-2 space-y-1">{children}</ol>,
  li: ({children}: any) => <li className="my-1 text-gray-800">{children}</li>,
  a: ({children, href}: any) => <a href={href} className="text-blue-600 hover:text-blue-800 underline">{children}</a>,
  table: ({children}: any) => <table className="w-full border-collapse border border-gray-300 my-2 text-sm">{children}</table>,
  thead: ({children}: any) => <thead className="bg-gray-200">{children}</thead>,
  tbody: ({children}: any) => <tbody>{children}</tbody>,
  tr: ({children}: any) => <tr className="border border-gray-300">{children}</tr>,
  th: ({children}: any) => <th className="border border-gray-300 px-3 py-2 text-left bg-gray-200 text-red-600 font-semibold">{children}</th>,
  td: ({children}: any) => <td className="border border-gray-300 px-3 py-2 text-gray-800">{children}</td>,
  p: ({children}: any) => <p className="text-gray-800 my-2">{children}</p>,
  hr: () => <hr className="border-t border-gray-300 my-4" />,
};

interface ColorfulMarkdownProps {
  children: string;
}

export function ColorfulMarkdown({ children }: ColorfulMarkdownProps) {
  return (
    <article className="max-w-none text-gray-800 leading-relaxed space-y-2">
      <ReactMarkdown components={ColorfulMarkdownComponents}>
        {children}
      </ReactMarkdown>
    </article>
  );
}
