import { memo } from 'react';
import DocViewer from "@cyntler/react-doc-viewer";
import { styled } from '@mui/material/styles';
import "@cyntler/react-doc-viewer/dist/index.css";
import MSDocRenderer from '../components/renderers/MSDocRenderer';
import GoogleRenderer from '../components/renderers/GoogleRenderer';


const StyledDocViewer = styled(DocViewer)(() => ({
  overflow: 'auto',
  '#pdf-controls': {
    backgroundColor: "rgba(255, 217, 194, 0.8)",
    width: '160px',
    zIndex: 3,
    justifyContent: 'center',
    borderRadius: '0 0 8px 0'
  },
}))

const CustomDocViewer = memo(({document, fileType}) => {
  return <StyledDocViewer
    config={{ 
      header: { disableFileName: true, disableHeader: true },
    }}
    documents={[{ uri: document?.arquivo, fileType }]}
    pluginRenderers={[MSDocRenderer, GoogleRenderer]}
    language='pt-br'
  />
})

export default CustomDocViewer