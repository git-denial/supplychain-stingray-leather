const projectId = "2GajDLTC6y04qsYsoDRq9nGmWwK";
const projectSecret = "48c62c6b3f82d2ecfa2cbe4c90f97037";
const projectIdAndSecret = `${projectId}:${projectSecret}`;

const { BufferList } = require("bl");
const ipfsAPI = require("ipfs-http-client");

const instance = ipfsAPI({
  host: "ipfs.infura.io",
  port: "5001",
  protocol: "https",
  headers: { authorization: `Basic ${Buffer.from(projectIdAndSecret).toString("base64")}` },
});

// helper function to "Get" from IPFS
// you usually go content.toString() after this...
const getFileFromHash = async hashToGet => {

  for await (const file of instance.get(hashToGet)) {
    console.log(file.path);

    if (!file.content) continue;
    
    const content = new BufferList();

    for await (const chunk of file.content) {
      content.append(chunk);
    }

    console.log(content);
    return content;
  }
};

export default {
  instance,
  getFileFromHash,
}