'use strict';

const deserialize = serialized => JSON.parse(serialized);

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
            create: _upsertEntity,
            update: _upsertEntity,
            delete: _deleteEntity,
            get: _getEntity,
            exists: _existsEntity,
        };
    }

    get relationships() {
        return {
            create: _upsertRelationship,
            update: _upsertRelationship,
            delete: _deleteRelationship,
            get: _getRelationship,
            exists: _existsRelationship,
        };
    }

    get state() {
        return this.state;
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
    }
}

const create = options => {
    return new MockProjection(options);
};

module.exports = create;
