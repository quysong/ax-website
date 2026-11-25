import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { ServerStyleSheet } from 'styled-components';
import App from './App';
import { GlobalStyle } from './styles';

export function render() {
  const sheet = new ServerStyleSheet();

  try {
    const html = renderToString(
      sheet.collectStyles(
        <StrictMode>
          <GlobalStyle />
          <App />
        </StrictMode>,
      ),
    );

    return { html, styleTags: sheet.getStyleTags() };
  } finally {
    sheet.seal();
  }
}
