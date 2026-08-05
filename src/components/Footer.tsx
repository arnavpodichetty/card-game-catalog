// Footer.tsx — site footer with the animated hero fan.
import { SuitLogo } from "./icons";
import { HeroFan } from "./CardArt";
import { Brand, BrandName } from "./brand.styles";
import { FooterBar, FooterInner, FooterWink, FooterFan } from "./footer.styles";

export function Footer() {
  return (
    <FooterBar>
      <FooterFan><HeroFan /></FooterFan>
      <FooterInner>
        <Brand as="div" $sm><SuitLogo size={24} /><BrandName>Card Game Catalog</BrandName></Brand>
        <p>Play any card game, anywhere, with anyone.</p>
        <FooterWink>No app to download. Just pass the tablet around. ✦</FooterWink>
      </FooterInner>
    </FooterBar>
  );
}
