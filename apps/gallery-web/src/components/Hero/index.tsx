import { Hero } from "./Hero";
import { useHero } from "./useHero";
import type { HeroProps } from "./useHero";

export default function HeroContainer(props: HeroProps) {
  const heroProps = useHero(props);
  return <Hero {...heroProps} />;
}
