const data = libs.req("data");

const cached = {};

export default async function getBlock(name) {
  if (!(name in cached) && await data.exists(`data/html_assets/block_data/${name}.html`)) {
    Object.defineProperty(cached, name, {
      value: await data.read(`data/html_assets/block_data/${name}.html`),
      writable: false,
      configurable: false
    });
  }
  return cached[name];
};