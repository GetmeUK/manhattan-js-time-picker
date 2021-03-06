import * as chai from 'chai'
import * as $ from 'manhattan-essentials'
import * as sinon from 'sinon'

import * as setup from './setup.js'
import {Clock} from '../module/clock.js'
import {Time} from '../module/time.js'

chai.should()
chai.use(require('sinon-chai'))

describe('Clock', () => {

    let pickerElm = null

    beforeEach(() => {
        pickerElm = $.create('div')
        document.body.appendChild(pickerElm)
    })

    afterEach(() => {
        document.body.removeChild(pickerElm)
    })

    describe('constructor', () => {
        it('should generate a new `Clock` instance', () => {
            const clock = new Clock(pickerElm)
            clock.should.be.an.instanceof(Clock)
        })
    })

    describe('getters & setters', () => {
        let clock = null

        beforeEach(() => {
            clock = new Clock(pickerElm)
            clock.init()
        })

        afterEach(() => {
            clock.destroy()
        })

        describe('clock', () => {
            it('should return the clock UI component element', () => {
                clock.clock
                    .classList
                    .contains(Clock.css['clock'])
                    .should
                    .be
                    .true
            })
        })

        describe('mode', () => {

            beforeEach(() => {
                sinon.spy(clock, '_update')
            })

            afterEach(() => {
                clock._update.restore()
            })

            it('should return the pick mode the clock is currently in', () => {
                clock.mode.should.equal('hour')
            })

            it('should set the pick mode the clock', () => {
                clock.mode = 'minute'
                clock.mode.should.equal('minute')
                clock._update.should.have.been.calledOnce
            })

            it('should throw an error if mode not set to minute or '
                + 'hour', () => {

                chai
                    .expect(() => { clock.mode = 'foobar' })
                    .to
                    .throw('Mode must be \'hour\' or \'minute\'.')
            })
        })

        describe('parent', () => {
            it('should return the parent element for the clock', () => {
                clock.parent.should.equal(pickerElm)
            })
        })

        describe('time', () => {

            beforeEach(() => {
                sinon.spy(clock, '_update')
            })

            afterEach(() => {
                clock._update.restore()
            })

            it('should return the time the clock is displaying', () => {
                clock.time.toString().should.equal('00:00:00')
            })

            it('should set the thime for the clock to display', () => {
                clock.time = new Time(13, 30)
                clock.time.toString().should.equal('13:30:00')
                clock._update.should.have.been.calledOnce
            })
        })

    })

    describe('public methods', () => {
        let clock = null

        beforeEach(() => {
            clock = new Clock(pickerElm)
            clock.init()
        })

        afterEach(() => {
            clock.destroy()
        })

        describe('destroy', () => {

            afterEach(() => {
                clock.init()
            })

            it('should destroy the clock', () => {
                clock.destroy()
                chai.expect(clock.clock).to.be.null
                chai.expect(pickerElm._mhClock).to.be.undefined
            })

            it('should allow the clock to be destroyed even if it has not '
                + 'been initialized', () => {

                clock.destroy()
                clock.destroy()
                chai.expect(clock.clock).to.be.null
                chai.expect(pickerElm._mhClock).to.be.undefined
            })
        })

        describe('init', () => {

            beforeEach(() => {
                clock.destroy()

                sinon.spy(clock._handlers, 'keepFocus')
                sinon.spy(clock._handlers, 'endPick')
                sinon.spy(clock._handlers, 'pick')
                sinon.spy(clock._handlers, 'startPick')
                sinon.spy(clock._handlers, 'switchToHour')
                sinon.spy(clock._handlers, 'switchToMinute')

                sinon.spy(clock, '_update')
            })

            afterEach(() => {
                clock.destroy()

                clock._handlers.keepFocus.restore()
                clock._handlers.endPick.restore()
                clock._handlers.pick.restore()
                clock._handlers.startPick.restore()
                clock._handlers.switchToHour.restore()
                clock._handlers.switchToMinute.restore()

                clock._update.restore()
            })

            it('should add a reference for the clock to the parent', () => {
                clock.init()
                pickerElm._mhClock.should.equal(clock)
            })

            it('should create a clock UI component', () => {
                const {css} = Clock

                clock.init()

                $.many(`.${css['clock']}`, pickerElm).length
                    .should
                    .equal(1)

                $.many(`.${css['dial']}`, pickerElm).length
                    .should
                    .equal(2)

                $.many(`.${css['dials']}`, pickerElm).length
                    .should
                    .equal(1)

                $.many(`.${css['hand']}`, pickerElm).length
                    .should
                    .equal(1)

                $.many(`.${css['hour']}`, pickerElm).length
                    .should
                    .equal(1)

                $.many(`.${css['mark']}`, pickerElm).length
                    .should
                    .equal(36)

                $.many(`.${css['minute']}`, pickerElm).length
                    .should
                    .equal(1)

                $.many(`.${css['time']}`, pickerElm).length
                    .should
                    .equal(1)

                clock._update.should.have.been.calledOnce
            })

            it('should set up event handlers for the date picker', () => {
                const {css} = Clock
                clock.init()

                // Keep focus
                $.dispatch(clock.clock, 'mousedown')
                clock._handlers.keepFocus.should.have.been.called

                // Switch to hour
                $.dispatch(clock._dom.hour, 'click')
                clock._handlers.switchToHour.should.have.been.called

                // Switch to minute
                $.dispatch(clock._dom.minute, 'click')
                clock._handlers.switchToMinute.should.have.been.called

                // Start pick
                $.dispatch(clock._dom.hourDial, 'mousedown')
                clock._handlers.startPick.should.have.been.calledOnce

                // Pick
                $.dispatch(document, 'mousemove')
                clock._handlers.pick.should.have.been.calledTwice

                // End pick
                $.dispatch(document, 'mouseup')
                clock._handlers.endPick.should.have.been.called

                // Start pick (vai minute dial)
                $.dispatch(clock._dom.minuteDial, 'mousedown')
                clock._handlers.startPick.should.have.been.calledTwice
            })

        })
    })

    describe('private methods', () => {
        let clock = null

        beforeEach(() => {
            clock = new Clock(pickerElm)
            clock.init()

            clock._dom.hourDial.getBoundingClientRect = () => {
                return {
                    'height': 220,
                    'left': 10,
                    'top': 10,
                    'width': 220
                }
            }

            clock._dom.minuteDial.getBoundingClientRect = () => {
                return {
                    'height': 220,
                    'left': 20,
                    'top': 20,
                    'width': 220
                }
            }
        })

        afterEach(() => {
            clock.destroy()
        })

        describe('_getDialCenter', () => {

            it('should return the coordinates for the center of the current '
                + 'dial elemnt', () => {

                clock._getDialCenter().should.deep.equal([120, 120])
                clock.mode = 'minute'
                clock._getDialCenter().should.deep.equal([130, 130])
            })

        })

        describe('_update', () => {

            beforeEach(() => {
                clock.init()
                clock.time = new Time(10, 30)
            })

            it('should update the clock to show the time', () => {
                clock._dom.hour.textContent = '10'
                clock._dom.minute.textContent = '30'
            })

            it('should update the size, angle and mark for the hand', () => {
                const hand = clock._dom.hand

                // Check hand correct for hour mode (small hand)
                hand.style.getPropertyValue('--angle').should.equal('300deg')
                hand.dataset.mhMark.should.equal('10')
                hand.classList.contains(Clock.css['handSmall']).should.be.true

                // Check hand correct for hour mode (big hand)
                clock.time = new Time(21, 30)
                hand.style.getPropertyValue('--angle').should.equal('270deg')
                hand.dataset.mhMark.should.equal('21')
                hand.classList.contains(Clock.css['handSmall']).should.be.false

                // Check hand correct for minute (on mark)
                clock.mode = 'minute'
                hand.style.getPropertyValue('--angle').should.equal('180deg')
                hand.dataset.mhMark.should.equal('30')

                // Check hand correct for minute (between mark)
                clock.time = new Time(21, 1)
                hand.style.getPropertyValue('--angle').should.equal('6deg')
                hand.dataset.mhMark.should.equal('')
            })
        })
    })

    describe('events', () => {
        let clock = null

        beforeEach(() => {
            clock = new Clock(pickerElm)
            clock.init()
        })

        afterEach(() => {
            clock.destroy()
        })

        describe('endPick', () => {

            it('should do nothing if not in picking mode', () => {
                const event = {'preventDefault': sinon.spy()}
                $.dispatch(clock.clock, 'mouseup', event)
                clock.mode.should.equal('hour')
            })

            it('should switch to minute mode if in hour mode', () => {
                const startEvent = {'preventDefault': sinon.spy()}
                $.dispatch(clock._dom.hourDial, 'mousedown', startEvent)

                const endEvent = {'preventDefault': sinon.spy()}
                $.dispatch(document, 'mouseup', endEvent)

                clock.mode.should.equal('minute')
            })

            it('should switch to hour mode and dispatch pick event if in '
                + 'hour mode', () => {

                const onPicked = sinon.spy()
                $.listen(clock.clock, {'picked': onPicked})

                clock.mode = 'minute'

                const startEvent = {'preventDefault': sinon.spy()}
                $.dispatch(clock._dom.hourDial, 'mousedown', startEvent)

                const endEvent = {'preventDefault': sinon.spy()}
                $.dispatch(document, 'mouseup', endEvent)

                clock.mode.should.equal('hour')
                onPicked.should.have.been.called
            })
        })

        describe('keepFocus', () => {

            it('should call prevent default against the event to prevent '
                + 'loss if focus', () => {

                const event = {'preventDefault': sinon.spy()}
                $.dispatch(clock.clock, 'mousedown', event)
                event.preventDefault.should.have.been.called
            })
        })

        describe('pick', () => {

            beforeEach(() => {
                clock._dom.hourDial.getBoundingClientRect = () => {
                    return {
                        'height': 220,
                        'left': 0,
                        'top': 0,
                        'width': 220
                    }
                }

                clock._dom.minuteDial.getBoundingClientRect = () => {
                    return {
                        'height': 220,
                        'left': 0,
                        'top': 0,
                        'width': 220
                    }
                }

                sinon.spy(clock, '_getDialCenter')
            })

            afterEach(() => {
                clock._getDialCenter.restore()
            })

            it('should do nothing if not in picking mode', () => {
                const event = {'preventDefault': sinon.spy()}
                $.dispatch(document, 'mousemove', event)
                clock._getDialCenter.should.not.have.been.called
            })

            it('should pick the correct hour', () => {

                const event = {'preventDefault': sinon.spy()}
                $.dispatch(clock._dom.hourDial, 'mousedown', event)

                // Hour 12
                const pickEvent = {
                    'pageX': 109,
                    'pageY': 0,
                    'preventDefault': sinon.spy()
                }
                $.dispatch(document, 'mousemove', pickEvent)
                clock.time.toString().should.equal('00:00:00')

                // Inner hour (< 12)
                pickEvent.pageX = 180
                pickEvent.pageY = 110
                $.dispatch(document, 'mousemove', pickEvent)
                clock.time.toString().should.equal('03:00:00')

                // Inner hour (0)
                pickEvent.pageX = 110
                pickEvent.pageY = 60
                $.dispatch(document, 'mousemove', pickEvent)
                clock.time.toString().should.equal('12:00:00')

                // Outer hour (> 12)
                pickEvent.pageX = 220
                pickEvent.pageY = 110
                $.dispatch(document, 'mousemove', pickEvent)
                clock.time.toString().should.equal('15:00:00')

                // Outer hour (0)
                pickEvent.pageX = 110
                pickEvent.pageY = 0
                $.dispatch(document, 'mousemove', pickEvent)
                clock.time.toString().should.equal('00:00:00')
            })

            it('should pick the correct minute', () => {

                const event = {'preventDefault': sinon.spy()}
                $.dispatch(clock._dom.hourDial, 'mousedown', event)

                clock.mode = 'minute'

                // Minute 60
                const pickEvent = {
                    'pageX': 109,
                    'pageY': 0,
                    'preventDefault': sinon.spy()
                }
                $.dispatch(document, 'mousemove', pickEvent)
                clock.time.toString().should.equal('00:00:00')

                // Minute (< 60)
                pickEvent.pageX = 220
                pickEvent.pageY = 110
                $.dispatch(document, 'mousemove', pickEvent)
                clock.time.toString().should.equal('00:15:00')
            })

            it('should work with touch events', () => {

                const event = {'preventDefault': sinon.spy()}
                $.dispatch(clock._dom.hourDial, 'mousedown', event)

                // Minute 60
                const pickEvent = {
                    'touches': [
                        {
                            'pageX': 220,
                            'pageY': 110
                        }
                    ],
                    'preventDefault': sinon.spy()
                }

                $.dispatch(document, 'mousemove', pickEvent)
                clock.time.toString().should.equal('15:00:00')
            })
        })

        describe('startPick', () => {

            it('should set the clock allow an hour or minute to be '
                + 'picked', () => {

                const event = {'preventDefault': sinon.spy()}
                $.dispatch(clock._dom.hourDial, 'mousedown', event)

                clock._picking.should.be.true
                clock.clock
                    .classList
                    .contains(Clock.css['clockPicking'])
                    .should
                    .be
                    .true
            })
        })

        describe('switchToHour', () => {

            it('should switch clock to hour mode', () => {
                clock.mode = 'minute'
                $.dispatch(clock._dom.hour, 'click', {})
                clock.mode.should.equal('hour')
            })

            it('should not switch if picking', () => {
                const event = {'preventDefault': sinon.spy()}
                clock._handlers.startPick(event)
                clock.mode = 'minute'
                $.dispatch(clock._dom.hour, 'click', {})
                clock.mode.should.equal('minute')
            })
        })

        describe('switchToMinute', () => {

            it('should switch clock to minute mode', () => {
                $.dispatch(clock._dom.minute, 'click', {})
                clock.mode.should.equal('minute')
            })

            it('should not switch if picking', () => {
                const event = {'preventDefault': sinon.spy()}
                clock._handlers.startPick(event)
                $.dispatch(clock._dom.minute, 'click', {})
                clock.mode.should.equal('hour')
            })
        })

    })
})
