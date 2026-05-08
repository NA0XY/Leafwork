declare module "html-docx-js/dist/html-docx" {
  const htmlDocx: {
    asBlob: (
      html: string,
      options?: {
        orientation?: "portrait" | "landscape";
        margins?: { top?: number; right?: number; bottom?: number; left?: number };
      }
    ) => Blob;
  };

  export default htmlDocx;
}
