// Soft 3D kitchen illustrations (from the user's icon set), shown on rounded cream tiles.
const base = import.meta.env.BASE_URL;

export type ArtName = 'chef-hat' | 'piping-bag' | 'pan' | 'whisk' | 'spatula' | 'mug' | 'board' | 'oven' | 'bottle' | 'dough' | 'bread' | 'towel';

export const CATEGORY_ART: Record<string, ArtName> = {
  All: 'spatula', Food: 'pan', Drink: 'mug', Baking: 'piping-bag', Beauty: 'bottle', Home: 'towel', Craft: 'board', Other: 'dough'
};

export default function Art({ name, size = 48, className = '' }: { name: ArtName; size?: number; className?: string }) {
  return (
    <img className={'art ' + className} src={`${base}icons/${name}.png`} alt="" aria-hidden="true"
      width={size} height={size} style={{ width: size, height: size }} draggable={false} />
  );
}
