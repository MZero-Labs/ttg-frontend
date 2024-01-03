import { storeToRefs } from "pinia";
import { Hash } from "viem";
import { useContractRead } from "use-wagmi";
import { powerTokenABI } from "@/lib/sdk";
import { useSpogStore } from "@/stores/spog";

export default (
  userAccount:
    | globalThis.Ref<undefined>
    | globalThis.Ref<`0x${string}`>
    | globalThis.Ref<`0x${string}` | undefined>
) => {
  const store = useSpogStore();
  const spog = storeToRefs(store);

  return useContractRead({
    address: spog.contracts.value.powerToken as Hash,
    abi: powerTokenABI,
    functionName: "delegates",
    args: [userAccount as Ref<Hash>],
    enabled: !!userAccount.value,
    watch: true,
    select: (data) => {
      console.log("delegates", data);
      return String(data);
    },
  });
};
