export const DISCLAIMER_TEXT =
  'Rescue the Surplus connects donors and receivers. We do not inspect, certify, or guarantee the safety of any food item. Handle all food with standard hygiene practices.';

export default function Disclaimer() {
  return <p className="rounded-lg bg-gray-100 p-3 text-sm text-gray-700">{DISCLAIMER_TEXT}</p>;
}
