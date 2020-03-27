import _ from 'lodash';
import { Command, Insert, Update, Delete, UpdateField, Condition } from '@dbgate/sqltree';

export interface ChangeSetItem {
  pureName: string;
  schemaName: string;
  insertedRowIndex?: number;
  condition?: { [column: string]: string };
  fields?: { [column: string]: string };
}

export interface ChangeSet {
  inserts: ChangeSetItem[];
  updates: ChangeSetItem[];
  deletes: ChangeSetItem[];
}

export function createChangeSet(): ChangeSet {
  return {
    inserts: [],
    updates: [],
    deletes: [],
  };
}

export interface ChangeSetRowDefinition {
  pureName: string;
  schemaName: string;
  insertedRowIndex?: number;
  condition?: { [column: string]: string };
}

export interface ChangeSetFieldDefinition extends ChangeSetRowDefinition {
  uniqueName: string;
  columnName: string;
}

export function findExistingChangeSetItem(
  changeSet: ChangeSet,
  definition: ChangeSetRowDefinition
): [keyof ChangeSet, ChangeSetItem] {
  if (definition.insertedRowIndex != null) {
    return [
      'inserts',
      changeSet.inserts.find(
        x =>
          x.pureName == definition.pureName &&
          x.schemaName == definition.schemaName &&
          x.insertedRowIndex == definition.insertedRowIndex
      ),
    ];
  } else {
    return [
      'updates',
      changeSet.updates.find(
        x =>
          x.pureName == definition.pureName &&
          x.schemaName == definition.schemaName &&
          _.isEqual(x.condition, definition.condition)
      ),
    ];
  }
}

export function setChangeSetValue(
  changeSet: ChangeSet,
  definition: ChangeSetFieldDefinition,
  value: string
): ChangeSet {
  const [fieldName, existingItem] = findExistingChangeSetItem(changeSet, definition);
  if (existingItem) {
    return {
      ...changeSet,
      [fieldName]: changeSet[fieldName].map(item =>
        item == existingItem
          ? {
              ...item,
              fields: {
                ...item.fields,
                [definition.uniqueName]: value,
              },
            }
          : item
      ),
    };
  }

  return {
    ...changeSet,
    [fieldName]: [
      ...changeSet[fieldName],
      {
        pureName: definition.pureName,
        schemaName: definition.schemaName,
        condition: definition.condition,
        insertedRowIndex: definition.insertedRowIndex,
        fields: {
          [definition.uniqueName]: value,
        },
      },
    ],
  };
}

function extractFields(item: ChangeSetItem): UpdateField[] {
  return _.keys(item.fields).map(targetColumn => ({
    targetColumn,
    exprType: 'value',
    value: item.fields[targetColumn],
  }));
}

function insertToSql(item: ChangeSetItem): Insert {
  return {
    targetTable: {
      pureName: item.pureName,
      schemaName: item.schemaName,
    },
    commandType: 'insert',
    fields: extractFields(item),
  };
}

function extractCondition(item: ChangeSetItem): Condition {
  return {
    conditionType: 'and',
    conditions: _.keys(item.condition).map(columnName => ({
      conditionType: 'binary',
      operator: '=',
      left: {
        exprType: 'column',
        columnName,
        source: {
          name: {
            pureName: item.pureName,
            schemaName: item.schemaName,
          },
        },
      },
      right: {
        exprType: 'value',
        value: item.condition[columnName],
      },
    })),
  };
}

function updateToSql(item: ChangeSetItem): Update {
  return {
    from: {
      name: {
        pureName: item.pureName,
        schemaName: item.schemaName,
      },
    },
    commandType: 'update',
    fields: extractFields(item),
    where: extractCondition(item),
  };
}

function deleteToSql(item: ChangeSetItem): Delete {
  return {
    from: {
      name: {
        pureName: item.pureName,
        schemaName: item.schemaName,
      },
    },
    commandType: 'delete',
    where: extractCondition(item),
  };
}

export function changeSetToSql(changeSet: ChangeSet): Command[] {
  return [
    ...changeSet.inserts.map(insertToSql),
    ...changeSet.updates.map(updateToSql),
    ...changeSet.deletes.map(deleteToSql),
  ];
}

export function revertChangeSetRowChanges(changeSet: ChangeSet, definition: ChangeSetRowDefinition): ChangeSet {
  const [field, item] = findExistingChangeSetItem(changeSet, definition);
  if (item)
    return {
      ...changeSet,
      [field]: changeSet[field].filter(x => x != item),
    };
  return changeSet;
}