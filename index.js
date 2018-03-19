'use strict';

const shouldProcess = event => {
    const { type } = event;
    return type.startsWith('CREATE_') || type.startsWith('DELETE_');
};

class MockProjection {

    constructor({ initialState }) {
        this.state = Object.assign({ entities: {} }, initialState);
    }

    reduce(event) {
        if (!shouldProcess(event)) {
            return { applied: false, state: this.state };
        }
        const { type, data } = event;
        const [ op ] = type.split('_');
        const delta = { op, entity: data };
        return this.patch(delta)
            .then(() => ({ delta, state: this.state, applied: true}));
    }

    patch(delta) {
        const { op, entity } = delta;
        if (op === 'CREATE' || op === 'UPDATE') {
            Object.assign(this.state.entities, { `${entity.type}_${entity.id}`: entity });
        } else if (op === 'DELETE') {
            delete this.state.entities[`${entity.type}_${entity.id}`];
        }
        return Promise.resolve();
    }
}

const create = moduleOptions => {
    return instanceOptions =>
        new MockProjection(Object.assign({}, moduleOptions, instanceOptions));
};

module.exports = create;
