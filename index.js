'use strict';

const deserialize = serialized =>
    typeof serialized === 'object'
        ? serialized
        : JSON.parse(serialized);

class MockProjection {

    constructor({ initialState }) {
        this.state = Object.assign({ entities: {}, relationships: {}},
            deserialize(initialState));
    }

    _upsertEntity(entity) {
        const delta = { op: '+', entities: { [`${entity.type}_${entity.id}`]: entity } };
        this.applyDelta(delta);
        return delta;
    }

    _deleteEntity(entity) {
        const delta = { op: '-', entities: { [`${entity.type}_${entity.id}`]: null } };
        this.applyDelta(delta);
        return delta;
    }

    _getEntity(type, id) {
        return this.state.entities[`${type}_${id}`];
    }

    _existsEntity(type, id) {
        return this._getEntity(type, id) !== undefined;
    }

    _upsertRelationship(relationship) {
        const { a, b } = relationship;
        const delta = {
            op: '+',
            relationships: {
                [`${a.type}_${a.id}__${b.type}_${b.id}`]: relationship
            }
        };
        this.applyDelta(delta);
        return delta;
    }

    _deleteRelationship(typeA, idA, typeB, idB) {
        const delta = {
            op: '-',
            relationships: {
                [`${typeA}_${idA}__${typeB}_${idB}`]: null
            }
        };
        this.applyDelta(delta);
        return delta;
    }

    _getRelationship(typeA, idA, typeB, idB) {
        return this.state.relationships[`${typeA}_${idA}__${typeB}_${idB}`];
    }

    _existsRelationship(type, id) {
        return this._getRelationship(typrA, idA, typeB, idB) !== undefined;
    }

    get entities() {
        return {
            create: this._upsertEntity.bind(this),
            update: this._upsertEntity.bind(this),
            delete: this._deleteEntity.bind(this),
            get: this._getEntity.bind(this),
            exists: this._existsEntity.bind(this),
        };
    }

    get relationships() {
        return {
            create: _upsertRelationship.bind(this),
            update: _upsertRelationship.bind(this),
            delete: _deleteRelationship.bind(this),
            get: _getRelationship.bind(this),
            exists: _existsRelationship.bind(this),
        };
    }

    serialize() {
        return JSON.stringify(this.state);
    }

    applyDelta(delta) {
        const { op } = delta;
        if (op === '+') {
            Object.assign(this.state.entities, delta.entities);
            Object.assign(this.state.relationships, delta.relationships);
        } else if (op === '-') {
            ['entities', 'relationships'].forEach(key => {
                if (delta[key]) {
                    Object
                        .keys(delta[key])
                        .forEach(id => {
                            delete this.state[key][id];
                        });
                }
            });
        }
        return Promise.resolve();
    }
}

const create = moduleOptions => {
    return instanceOptions =>
        new MockProjection(Object.assign({}, moduleOptions, instanceOptions));
};

module.exports = create;
