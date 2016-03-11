
import Rx from 'rx';

const { interval, zip, fromEvent, merge } = Rx.Observable;

const { assign } = Object;

const HEIGHT = 620;
const GROUND = 530;
const INTERVAL = 1000/30;

const ground = { id:'ground', x: 0, y: HEIGHT - 60 };



import React from 'react';
import { render } from 'react-dom';

const createEntity = (entityDesc) => {
    return <div style={assign( { position: 'absolute', left: entityDesc.x, top: entityDesc.y}, entityDesc.style || {} )}
        key={entityDesc.key || entityDesc.id} className={entityDesc.id}></div>;
};


export const renderEntities = (node, entities) => {
    const reactEl = <div style={{ position: 'relative'}}>
            {entities.map( ex => {
                return createEntity(ex);
            })}
    </div>;
    render( reactEl, node);
};


//rxjs returns this as code with ArrowUp, ArrowDown etc
//convert it to {x,y}
const keyMapper = ( keyInput ) => {

    const key = { x: 0, y: 0 };

    if ( keyInput && keyInput.length > 0 ) {
        const { code } = keyInput[keyInput.length - 1];

        if ( code === 'ArrowRight' ) {
            key.x = 1;
        } else if ( code=== 'ArrowLeft' ) {
            key.x = -1;
        }
        if ( code === 'ArrowUp' ) {
            key.y = 1;
        } else if ( code === 'ArrowDown' ) {
            key.y = -1;
        }
    }
    return key;
};


const physics = ( tick, mario ) => {
    const y = mario.y + ( tick.interval * (mario.vy * -1 ));
    return assign(mario, { x: mario.x + (tick.interval * mario.vx), y: y > GROUND ? GROUND : y });
};

const walk = ( key, mario ) => {
    return assign(mario, { vx: parseFloat( key.x / 6 ) } );
};

const jump = ( key, mario ) => {
    if ( key.y > 0 && mario.y === GROUND ) {
        return assign(mario, { vy: 0.2 });
    }
    return mario;
};

const gravity = ( tick, mario ) => {
    return assign(mario, { vy: mario.vy - ( tick.interval / 3000 )});
};

export const createGame = (node) => {

    //this is our renderloop =30fps, we need to get timeInterval to get tick deltas
    const tick$ = interval(INTERVAL).timeInterval();

    //keyinput, we merge keyup and keyodown events and map them to an object with x,y value
    //which can be 1,0,-1 e.g. {x:1,y: 0 } - right is pressed, {x: -1, y} - down is pressed
    //conversion is down by keyMapper
    const keyInput$ = merge(fromEvent(window, 'keyup'),
            fromEvent(window, 'keydown')).buffer(tick$).map( keyMapper );

    const mario$ = zip(tick$, keyInput$ ).scan( ( mario, arr) => {
        const tick = arr[0];
        const key = arr[1];

        const physicsResult = physics(tick, mario);
        const walkResult = walk(key, physicsResult);
        const jumpResult = jump(key, walkResult);
        return gravity(tick, jumpResult);


    }, {id: 'mario', style: {background: "url('img/stand/right.gif') no-repeat 0 0"},
        x: 500/2, y: GROUND, vx: 0.0, vy: 0.0 });

    zip(mario$, (mario) => {

        var verb = 'stand';
        var dir = 'right';
        if ( mario.vy > 0 ) {
            verb = 'jump';
        } else if ( mario.vx !== 0 ) {
            verb ='walk';
        }
        if ( mario.vx < 0 ) {
            dir = 'left';
        }
        const bgStyle = `url('img/${verb}/${dir}.gif') no-repeat 0 0`;
        return [ ground, assign(mario, { style: {background: bgStyle }} ) ];
    }).subscribe( renderEntities.bind(null, node) );
};
