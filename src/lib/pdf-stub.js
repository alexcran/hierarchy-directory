const noop = () => null
export const Document = noop
export const Page = noop
export const View = noop
export const Text = noop
export const Image = noop
export const Font = { register: () => {}, load: async () => {} }
export const StyleSheet = { create: (s) => s }
export const PDFViewer = noop
export const pdf = () => ({ toBlob: async () => null })
