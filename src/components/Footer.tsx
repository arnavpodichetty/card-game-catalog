// Footer.tsx — site footer with the animated hero fan.
import { SuitLogo } from "./icons";
import { HeroFan } from "./CardArt";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__fan"><HeroFan /></div>
      <div className="footer__inner">
        <div className="brand brand--sm"><SuitLogo size={24} /><span className="brand__name">Card Game Catalog</span></div>
        <p>Play any card game, anywhere, with anyone.</p>
        <span className="footer__wink">No app to download. Just pass the tablet around. ✦</span>
      </div>
    </footer>
  );
}
