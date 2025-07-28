export interface ContentDefinition {
  id: string;
  src: string;
  unfilled?: boolean;
}

interface ContentDelivery {
  render: () => void;
  sendViewable: (inview: boolean) => void;
}

export interface RDNContentWindow extends Window {
  rdncd?: ContentDefinition;
  rdnadm?: string;
  cd?: ContentDelivery;
  renderWithoutIframe?: boolean;
}

export interface ContentIframeWindow extends Window {
  vast?: string;
}
