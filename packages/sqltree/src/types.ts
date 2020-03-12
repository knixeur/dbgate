import { NamedObjectInfo, RangeDefinition } from '@dbgate/types';

// export interface Command {
// }

export interface Select {
  commandType: 'select';

  from: FromDefinition;

  columns?: ResultField[];
  topRecords?: number;
  range?: RangeDefinition;
  distinct?: boolean;
  selectAll?: boolean;
  orderBy?: OrderByExpression[];
  groupBy?: Expression[];
}

export type Command = Select;

// export interface Condition {
//   conditionType: "eq" | "not" | "binary";
// }

export interface UnaryCondition {
  expr: Expression;
}

export interface BinaryCondition {
  operator: '=' | '!=' | '<' | '>' | '>=' | '<=';
  conditionType: 'binary';
  left: Expression;
  right: Expression;
}

export interface NotCondition extends UnaryCondition {
  conditionType: 'not';
}

export type Condition = BinaryCondition | NotCondition;

export interface Source {
  name?: NamedObjectInfo;
  alias?: string;
  subQuery?: Select;
  subQueryString?: string;
}

export type JoinType = 'LEFT JOIN' | 'INNER JOIN' | 'RIGHT JOIN';

export type Relation = Source & {
  conditions: Condition[];
  joinType: JoinType;
};
export type FromDefinition = Source & { relations?: Relation[] };

// export interface Expression {
//   exprType: "column" | "value" | "string" | "literal" | "count";
// }

export interface ColumnRefExpression {
  exprType: 'column';
  columnName: string;
  source?: Source;
}

export interface ValueExpression {
  exprType: 'value';
  value: any;
}

export interface PlaceholderExpression {
  exprType: 'placeholder';
}

export type Expression = ColumnRefExpression | ValueExpression | PlaceholderExpression;
export type OrderByExpression = Expression & { direction: 'ASC' | 'DESC' };

export type ResultField = Expression & { alias?: string };