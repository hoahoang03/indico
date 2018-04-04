/* This file is part of Indico.
 * Copyright (C) 2002 - 2018 European Organization for Nuclear Research (CERN).
 *
 * Indico is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 3 of the
 * License, or (at your option) any later version.
 *
 * Indico is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Indico; if not, see <http://www.gnu.org/licenses/>.
 */

import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';

import {Paginator, TooltipIfTruncated, MessageBox} from 'indico/react/components';

import LogEntryModal from '../containers/LogEntryModal';


class LogEntry extends React.PureComponent {
    static propTypes = {
        entry: PropTypes.object.isRequired,
        setDetailedView: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.openDetails = this.openDetails.bind(this);
    }

    openDetails(index) {
        const {setDetailedView} = this.props;
        setDetailedView(index);
    }

    iconProps(entry) {
        if (entry.type === 'email') {
            switch (entry.payload.state) {
                case 'pending':
                    return {
                        'className': 'log-icon semantic-text warning',
                        'title': 'This email is pending and will be sent soon.',
                        'data-qtip-style': 'warning'
                    };
                case 'sent':
                    return {
                        'className': 'log-icon semantic-text success',
                        'title': 'This email has been sent.',
                        'data-qtip-style': 'success'
                    };
                case 'failed':
                    return {
                        'className': 'log-icon semantic-text error',
                        'title': 'Sending this email failed.',
                        'data-qtip-style': 'danger'
                    };
            }
        }

        return {className: 'log-icon'};
    }

    entryKind(entry) {
        if (entry.type !== 'email') {
            return entry.kind;
        }

        const mapping = {pending: 'change', sent: 'positive', failed: 'negative'};
        return mapping[entry.payload.state] || 'other';
    }

    render() {
        const {entry} = this.props;
        return (
            <li className={`log-realm-${entry.realm} log-kind-${this.entryKind(entry)}`}>
                <span className="log-module">
                    <span {...this.iconProps(entry)}>
                        <i className="log-realm" />
                        <i className="log-kind icon-circle-small" />
                    </span>
                    <span className="bold">
                        {entry.module}
                    </span>
                </span>
                <TooltipIfTruncated>
                    <span className="log-entry-description"
                          onClick={() => this.openDetails(entry.index)}>
                        {entry.description}
                    </span>
                </TooltipIfTruncated>
                <span className="log-entry-details">
                    <span className="logged-time"
                          title={moment(entry.time).format('DD/MM/YYYY HH:mm')}>
                        <time dateTime={entry.time}>
                            {moment(entry.time).fromNow()}
                        </time>
                    </span>
                    {entry.user.fullName ? (
                        <span className="avatar-placeholder" style={{backgroundColor: entry.user.avatarColor}}
                              title={entry.user.fullName}>
                            {entry.user.fullName[0]}
                        </span>
                    ) : ''}
                </span>
            </li>
        );
    }
}


export default class LogEntryList extends React.PureComponent {
    static propTypes = {
        entries: PropTypes.array.isRequired,
        currentPage: PropTypes.number.isRequired,
        pages: PropTypes.array.isRequired,
        changePage: PropTypes.func.isRequired,
        isFetching: PropTypes.bool.isRequired,
        setDetailedView: PropTypes.func.isRequired,
    };

    renderEmpty() {
        return (
            <MessageBox type="info">
                No logs to show
            </MessageBox>
        );
    }

    renderSpinner() {
        return (
            <div className="event-log-list-spinner">
                <div className="i-spinner" />
            </div>
        );
    }

    renderList() {
        const {entries, pages, currentPage, changePage, isFetching, setDetailedView} = this.props;
        return (
            <>
                {isFetching && this.renderSpinner()}
                <ul className={`event-log-list ${isFetching ? 'loading' : ''}`}>
                    {entries.map((entry) => (
                        <LogEntry key={entry.id} entry={entry} setDetailedView={setDetailedView} />
                    ))}
                </ul>
                {!isFetching && <Paginator currentPage={currentPage} pages={pages} changePage={changePage} />}
                <LogEntryModal entries={entries} />
            </>
        );
    }

    render() {
        const {entries, isFetching} = this.props;
        if (entries.length === 0) {
            if (isFetching) {
                return this.renderSpinner();
            }

            return this.renderEmpty();
        } else {
            return this.renderList();
        }
    }
}