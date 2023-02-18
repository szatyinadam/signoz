import { Drawer, Tabs } from 'antd';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { AppState } from 'store/reducers';
import AppActions from 'types/actions';
import { SET_DETAILED_LOG_DATA } from 'types/actions/logs';
import { ILogsReducer } from 'types/reducer/logs';

import JSONView from './JsonView';
import TableView from './TableView';

function LogDetailedView(): JSX.Element {
	const { detailedLog } = useSelector<AppState, ILogsReducer>(
		(state) => state.logs,
	);

	const dispatch = useDispatch<Dispatch<AppActions>>();

	const onDrawerClose = (): void => {
		dispatch({
			type: SET_DETAILED_LOG_DATA,
			payload: null,
		});
	};

	return (
		<Drawer
			width="60%"
			title="Log Details"
			placement="right"
			closable
			onClose={onDrawerClose}
			open={detailedLog !== null}
			style={{ overscrollBehavior: 'contain' }}
			destroyOnClose
		>
			<Tabs defaultActiveKey="1">
				<Tabs.TabPane tab="Table" key="1">
					{detailedLog && <TableView logData={detailedLog} />}
				</Tabs.TabPane>
				<Tabs.TabPane tab="JSON" key="2">
					{detailedLog && <JSONView logData={detailedLog} />}
				</Tabs.TabPane>
			</Tabs>
		</Drawer>
	);
}

export default LogDetailedView;
