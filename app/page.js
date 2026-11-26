import Image from "next/image";
import BombScene from "@/components/BombScene";
import { CONFIG } from "@/lib/config";

const steps = [
  {
    title: "Get a Solana wallet",
    text: "Install Phantom from phantom.com or another Solana wallet. Write your recovery phrase down offline and never share it.",
  },
  {
    title: "Add SOL",
    text: "Buy SOL from an exchange available in your country and send it to your wallet. Keep a little extra for network fees.",
  },
  {
    title: "Find BOMB",
    text: "Open the official Raydium page for BOMB. Check that the contract address matches the one on this site before you connect.",
  },
  {
    title: "Swap SOL for BOMB",
    text: "Enter an amount, review the transaction in your wallet, and confirm. Only spend what you can afford to lose.",
  },
];

function SocialLink({ href, children }) {
  if (!href) return <span className="soon">{children} (soon)</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export default function Home() {
  return (
    <>
      <header className="bar">
        <a href="#top" className="brand" aria-label="BOMB home">
          <Image src="/logo.png" alt="" width={44} height={44} priority />
          <span>BOMB</span>
        </a>
        <nav aria-label="Main">
          <a href="#about">About</a>
          <a href="#how-to-buy">How to buy</a>
          <a href="#risk">Risk</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <h1>
              One headline
              <br />
              away from
              <br />
              chaos.
            </h1>
            <p className="lede">
              BOMB is a satirical meme coin on Solana. No roadmap, no utility, no promises. Just one very big red
              button.
            </p>
            <div className="ca" role="group" aria-label="Contract address">
              <span className="ca-label">Contract address</span>
              <code>{CONFIG.contractAddress || "Published at launch"}</code>
            </div>
            <div className="cta-row">
              {CONFIG.raydium ? (
                <a className="btn" href={CONFIG.raydium} target="_blank" rel="noopener noreferrer">
                  Buy BOMB on Raydium
                </a>
              ) : (
                <a className="btn" href="#how-to-buy">
                  How to buy
                </a>
              )}
              <SocialLink href={CONFIG.x}>Follow on X</SocialLink>
              <SocialLink href={CONFIG.telegram}>Join Telegram</SocialLink>
            </div>
          </div>
          <BombScene />
        </section>

        <section id="about" className="block">
          <h2>What is BOMB?</h2>
          <p>
            A joke about how every news cycle feels like it could tip over at any moment. BOMB is a meme coin: it
            has no intrinsic value, no team promises and no utility. It exists for the memes and the community
            around them.
          </p>
          <dl className="facts">
            <div>
              <dt>Network</dt>
              <dd>Solana</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>Meme coin</dd>
            </div>
            <div>
              <dt>Utility</dt>
              <dd>None</dd>
            </div>
            <div>
              <dt>Launch</dt>
              <dd>Raydium LaunchLab</dd>
            </div>
          </dl>
        </section>

        <section id="how-to-buy" className="block">
          <h2>How to buy</h2>
          <ol className="steps">
            {steps.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="risk" className="caution">
          <div className="caution-inner">
            <h2>Read this before you buy</h2>
            <p>
              BOMB is a meme coin. It can lose all of its value, and most meme coins do. Nothing on this site is
              financial advice, and nothing here promises a return. Do your own research and only risk money you can
              afford to lose.
            </p>
            <p>
              BOMB is not affiliated with any government, politician or political organization.
            </p>
          </div>
        </section>
      </main>

      <footer className="foot">
        <span>© BOMB. A joke on Solana.</span>
      </footer>
    </>
  );
}
