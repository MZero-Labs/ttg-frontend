import { storeToRefs } from "pinia";
import { Hash } from "viem";
import { useToken } from "use-wagmi";

const store = useSpogStore();
const spog = storeToRefs(store);
const network = useNetworkStore().getNetwork();

export default () => {
  return useToken({
    address: spog.contracts.value.powerToken as Hash,
    chainId: network.value.rpc.chainId,
  });
};
