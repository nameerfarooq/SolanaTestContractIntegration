import { useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletName } from "@solana/wallet-adapter-phantom";
const Wallet = () => {
  const { connected, connect, disconnect, select, publicKey } = useWallet();
  select(PhantomWalletName);
  console.log(connected, " ; Connected");
  const handleConnect = async () => {
    console.log("CHECKING CONNECTED STATE :::::::", connected);
    if (connected) {
      console.log("its connected, disconnect it");
      disconnect();
    } else {
      console.log("its disconnected, connecting it");
      connect();
    }
  };
  return (
    <div>
      <button onClick={handleConnect}>
        {" "}
        {connected ? "disconnect" : "connect"}{" "}
      </button>
      <p>{publicKey ? publicKey.toString() : ""}</p>
      <p>Wallet Connected : {connected.toString()}</p>
    </div>
  );
};

export default Wallet;
