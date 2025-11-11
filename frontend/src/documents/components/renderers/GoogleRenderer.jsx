import React, { useState } from "react";
import styled from "styled-components";
import MyLoadingRenderer from "../MyLoadingRenderer";

const GoogleRenderer = ({ mainState: { currentDocument } }) => {
  const [loading, setLoading] = useState(true)

  if (!currentDocument) return null;

  return (
    <Container id="Google-renderer">
      <IFrame
        id="Google-iframe"
        title="Google-iframe"
        onLoad={() => setLoading(false)}
        src={`https://docs.google.com/gview?embedded=true&hl=pt-BR&url=${encodeURIComponent(
          currentDocument.uri,
        )}`}
        frameBorder="0"
      />
      {loading ? <MyLoadingRenderer document={currentDocument} /> : null}
    </Container>
  );
};

export default GoogleRenderer;

const GoogleFTMaps = {
  odt: ["odt", "application/vnd.oasis.opendocument.text"],
  doc: ["doc", "application/msword"],
  docx: [
    "docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ],
  ppt: ["ppt", "application/vnd.ms-powerpoint"],
  pptx: [
    "pptx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  docm: ["docm", "application/msword"],
  pdf: ["pdf", "application/pdf"]
};

GoogleRenderer.fileTypes = [
  ...GoogleFTMaps.odt,
  ...GoogleFTMaps.doc,
  ...GoogleFTMaps.docx,
  ...GoogleFTMaps.docm,
  ...GoogleFTMaps.ppt,
  ...GoogleFTMaps.pptx,
  ...GoogleFTMaps.pdf,
  
];
GoogleRenderer.weight = 0;
GoogleRenderer.fileLoader = ({ fileLoaderComplete }) => fileLoaderComplete();

export const Container = styled.div`
  width: 100%;
  position: relative;
`;

export const IFrame = styled.iframe`
  width: 100%;
  height: 900px;

  @media (max-width: 768px) {
    height: 500px;
  }
  border: 0;
`;