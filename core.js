export async function getModule() {
  try {
      const md = await import('/node_modules/@intention-network/core/main.js');
      return md.default;
  } catch (e) {
      return (await import('@intention-network/core')).default;
  }    
}

export default {
  getModule
}

