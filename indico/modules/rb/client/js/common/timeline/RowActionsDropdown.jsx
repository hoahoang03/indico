// This file is part of Indico.
// Copyright (C) 2002 - 2019 CERN
//
// Indico is free software; you can redistribute it and/or
// modify it under the terms of the MIT License; see the
// LICENSE file for more details.

import React from 'react';
import PropTypes from 'prop-types';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Form as FinalForm} from 'react-final-form';
import {Button, Confirm, Dropdown, Form, Icon, Portal} from 'semantic-ui-react';

import {serializeDate} from 'indico/utils/date';
import {FinalTextArea} from 'indico/react/forms';
import {Param, Translate} from 'indico/react/i18n';

import {actions as bookingsActions} from '../bookings';
import SingleRoomTimelineModal from './SingleRoomTimelineModal';

import './RowActionsDropdown.module.scss';


class RowActionsDropdown extends React.Component {
    static propTypes = {
        booking: PropTypes.object,
        date: PropTypes.object,
        room: PropTypes.object,
        actions: PropTypes.exact({
            changeBookingOccurrenceState: PropTypes.func.isRequired,
            fetchBookingDetails: PropTypes.func.isRequired,
        }).isRequired,
    };

    static defaultProps = {
        booking: null,
        date: null,
        room: null,
    };

    constructor(props) {
        super(props);
        this.dropdownIconRef = React.createRef();
    }

    state = {
        actionInProgress: false,
        activeConfirmation: null,
        activeRoomTimeline: false,
        dropdownOpen: false,
        top: 0,
        left: 0,
    };


    hideConfirm = () => {
        this.setState({activeConfirmation: null});
    };

    showConfirm = (type) => {
        this.setState({activeConfirmation: type});
    };

    showRoomTimeline = () => {
        this.setState({activeRoomTimeline: true});
    };

    hideRoomTimeline = () => {
        this.setState({activeRoomTimeline: false});
    };

    changeOccurrenceState = async (action, data = {}) => {
        const {
            date,
            booking: {id},
            actions: {changeBookingOccurrenceState, fetchBookingDetails}
        } = this.props;
        const serializedDate = serializeDate(date);
        this.setState({actionInProgress: true});
        await changeBookingOccurrenceState(id, serializedDate, action, data);
        await fetchBookingDetails(id);
        this.setState({actionInProgress: false});
    };

    findPositioning = () => {
        const positioning = this.dropdownIconRef.current.getBoundingClientRect();
        return {
            top: positioning.bottom - (positioning.height / 2),
            left: positioning.right,
        };
    };

    handleButtonClick = () => {
        const {top, left} = this.findPositioning();
        this.setState({
            dropdownOpen: true,
            top,
            left
        });
    };

    renderRejectionForm = ({handleSubmit, hasValidationErrors, submitSucceeded, submitting, pristine}) => {
        const {date} = this.props;
        const serializedDate = serializeDate(date, 'L');
        return (
            <Form styleName="rejection-form" onSubmit={handleSubmit}>
                <div styleName="form-description">
                    <Translate>
                        Are you sure you want to reject this occurrence (<Param name="date" value={serializedDate} />)?
                    </Translate>
                </div>
                <FinalTextArea name="reason"
                               placeholder={Translate.string('Provide the rejection reason')}
                               disabled={submitSucceeded}
                               rows={2}
                               required
                               autoFocus />
                <Button type="submit"
                        disabled={submitting || pristine || hasValidationErrors || submitSucceeded}
                        loading={submitting}
                        floated="right"
                        primary>
                    <Translate>Reject</Translate>
                </Button>
            </Form>
        );
    };

    render() {
        const {activeConfirmation, activeRoomTimeline, actionInProgress, dropdownOpen, top, left} = this.state;
        const {booking, date, room} = this.props;
        const serializedDate = serializeDate(date, 'L');
        let canCancel, canReject;
        const rejectionForm = (
            <FinalForm onSubmit={(data) => this.changeOccurrenceState('reject', data)}
                       render={this.renderRejectionForm} />
        );

        if (booking) {
            ({canCancel, canReject} = booking.occurrences.bookings[serializeDate(date)][0]);
        }

        if (!canCancel && !canReject && !room) {
            return null;
        }

        const styleName = (dropdownOpen ? 'dropdown-button open' : 'dropdown-button');
        return (
            <div styleName="actions-dropdown">
                <Portal closeOnTriggerClick
                        openOnTriggerClick
                        onOpen={this.handleButtonClick}
                        onClose={() => this.setState({dropdownOpen: false})}
                        trigger={
                            <Button styleName={styleName}
                                    onClick={this.handleButtonClick}
                                    loading={actionInProgress}>
                                <Button.Content>
                                    <div ref={this.dropdownIconRef}>
                                        <Icon name="ellipsis horizontal" size="large" />
                                    </div>
                                </Button.Content>
                            </Button>
                        }>
                    <Dropdown icon={null}
                              open
                              style={{left: `${left}px`, position: 'fixed', top: `${top}px`, zIndex: 1000}}>
                        <Dropdown.Menu direction="left">
                            {canCancel && (
                                <Dropdown.Item icon="times"
                                               text={Translate.string('Cancel occurrence')}
                                               onClick={() => this.showConfirm('cancel')} />
                            )}
                            {canReject && (
                                <Dropdown.Item icon="times circle"
                                               text={Translate.string('Reject occurrence')}
                                               onClick={() => this.showConfirm('reject')} />
                            )}
                            {room && (
                                <Dropdown.Item icon="list"
                                               text={Translate.string('Show room timeline')}
                                               onClick={() => this.showRoomTimeline(room)} />
                            )}
                        </Dropdown.Menu>
                    </Dropdown>
                </Portal>
                <Confirm header={Translate.string('Confirm cancellation')}
                         content={
                             Translate.string(
                                 'Are you sure you want to cancel this occurrence ({serializedDate})?',
                                 {serializedDate}
                             )
                         }
                         confirmButton={<Button content={Translate.string('Cancel occurrence')} negative />}
                         cancelButton={Translate.string('Close')}
                         open={activeConfirmation === 'cancel'}
                         onCancel={this.hideConfirm}
                         onConfirm={() => {
                             this.changeOccurrenceState('cancel');
                             this.hideConfirm();
                         }} />
                <Confirm header={Translate.string('Confirm rejection')}
                         content={rejectionForm}
                         confirmButton={null}
                         cancelButton={Translate.string('Close')}
                         open={activeConfirmation === 'reject'}
                         onCancel={this.hideConfirm} />
                {room && (
                    <SingleRoomTimelineModal open={activeRoomTimeline}
                                             onClose={this.hideRoomTimeline}
                                             room={room} />
                )}
            </div>
        );
    }
}

export default connect(
    null,
    (dispatch) => ({
        actions: bindActionCreators({
            changeBookingOccurrenceState: bookingsActions.changeBookingOccurrenceState,
            fetchBookingDetails: bookingsActions.fetchBookingDetails,
        }, dispatch)
    }),
)(RowActionsDropdown);
