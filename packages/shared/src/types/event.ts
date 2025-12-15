export type ParadoxScalar = string | number | boolean | null;

export type ParadoxValue = ParadoxScalar | ParadoxValue[] | { [key: string]: ParadoxValue };

export type EventTriggerCondition = {
  and?: EventTriggerCondition[];
  or?: EventTriggerCondition[];
  not?: EventTriggerCondition;
  condition?: string;
  parameters?: Record<string, ParadoxValue>;
};

export type EventOption = {
  id?: string | number;
  name?: string; // localization key
  title?: string;
  desc?: string;
  trigger?: EventTriggerCondition;
  ai_chance?: number;
  effects?: ParadoxValue;
};

export type EventImmediate = ParadoxValue;

export type EventDependencyType = 'flag' | 'temporal' | 'event_reference';

export type EventDependency = {
  type: EventDependencyType;
  key: string;
  sourceEventId: string;
  targetEventId?: string;
  path?: string;
  details?: string;
  isMissing?: boolean;
};

export type EventDependencyGraph = {
  eventId: string;
  namespace?: string;
  dependencies: EventDependency[];
};

export type TimelineEvent = {
  eventId: string;
  namespace?: string;
  event: import('./localization').LocalizedEvent;
  temporalData?: {
    year?: number;
    date?: string;
    condition?: string;
  };
  dependencies: {
    incoming: EventDependency[];
    outgoing: EventDependency[];
  };
};

export type TimelineData = {
  events: TimelineEvent[];
  dateRange: {
    min?: number;
    max?: number;
  };
};

export type ParsedEvent = {
  namespace?: string;
  id: string | number;
  title?: string;
  desc?: string;
  picture?: string;
  trigger?: EventTriggerCondition;
  immediate?: EventImmediate;
  options?: EventOption[];
  is_triggered_only?: boolean;
  fire_only_once?: boolean;
  mean_time_to_happen?: ParadoxValue;
  hidden?: boolean;
  major?: boolean;
};

export type RawParadoxBlock = {
  key?: string;
  operator?: string;
  value?: ParadoxValue;
  children?: RawParadoxBlock[];
};

export type EventQueryParams = {
  country?: string;
  language?: import('./localization').SupportedLanguage;
  source?: 'vanilla' | 'local';
};

export type EventByIdParams = {
  id: string;
  language?: import('./localization').SupportedLanguage;
  source?: 'vanilla' | 'local';
};
