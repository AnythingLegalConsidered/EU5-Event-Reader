export type Country = {
  tag: string; // ex: "ARA", "PLC"
  name: string; // localized name
  eventCount: number;
  namespace?: string; // ex: "flavor_ara"
};
