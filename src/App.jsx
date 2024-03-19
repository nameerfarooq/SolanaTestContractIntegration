import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
// import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { useMemo } from "react";
import Wallet from "./Components/Wallet";
import Locker from "./Components/Locker";

const App = () => {
  const endpoint =
    "https://palpable-patient-resonance.solana-devnet.quiknode.pro/bdd5572aa6ebbc530988e73d26ab70eb6796406c/";

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets}>
        <Wallet />
        <Locker />
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
