export async function getModule() {
  try {
      const md = await import('/node_modules/@intention-network/messages/main.js');
      return md.default;
  } catch (e) {
      return (await import('@intention-network/messages')).default;
  }    
}

export default {
  getModule
}

