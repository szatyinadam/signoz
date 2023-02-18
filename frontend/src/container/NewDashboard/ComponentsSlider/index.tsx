/* eslint-disable @typescript-eslint/naming-convention */

import { useIsDarkMode } from 'hooks/useDarkMode';
import { useNotifications } from 'hooks/useNotifications';
import history from 'lib/history';
import React, { useCallback } from 'react';
import { connect, useSelector } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import {
	ToggleAddWidget,
	ToggleAddWidgetProps,
} from 'store/actions/dashboard/toggleAddWidget';
import { AppState } from 'store/reducers';
import AppActions from 'types/actions';
import DashboardReducer from 'types/reducer/dashboards';

import menuItems, { ITEMS } from './menuItems';
import { Card, Container, Text } from './styles';

function DashboardGraphSlider({ toggleAddWidget }: Props): JSX.Element {
	const { dashboards } = useSelector<AppState, DashboardReducer>(
		(state) => state.dashboards,
	);

	const { notifications } = useNotifications();

	const [selectedDashboard] = dashboards;
	const { data } = selectedDashboard;

	const onClickHandler = useCallback(
		async (name: ITEMS) => {
			try {
				const emptyLayout = data.layout?.find((e) => e.i === 'empty');

				if (emptyLayout === undefined) {
					notifications.error({
						message: 'Please click on Add Panel Button',
					});
					return;
				}

				toggleAddWidget(false);

				history.push(
					`${history.location.pathname}/new?graphType=${name}&widgetId=${emptyLayout.i}`,
				);
			} catch (error) {
				notifications.error({
					message: 'Something went wrong',
				});
			}
		},
		[data, toggleAddWidget, notifications],
	);
	const isDarkMode = useIsDarkMode();
	const fillColor: React.CSSProperties['color'] = isDarkMode ? 'white' : 'black';

	return (
		<Container>
			{menuItems.map(({ name, Icon, display }) => (
				<Card
					onClick={(event): void => {
						event.preventDefault();
						onClickHandler(name);
					}}
					id={name}
					key={name}
				>
					<Icon fillColor={fillColor} />
					<Text>{display}</Text>
				</Card>
			))}
		</Container>
	);
}

export type GRAPH_TYPES = ITEMS;

interface DispatchProps {
	toggleAddWidget: (
		props: ToggleAddWidgetProps,
	) => (dispatch: Dispatch<AppActions>) => void;
}

const mapDispatchToProps = (
	dispatch: ThunkDispatch<unknown, unknown, AppActions>,
): DispatchProps => ({
	toggleAddWidget: bindActionCreators(ToggleAddWidget, dispatch),
});

type Props = DispatchProps;

export default connect(null, mapDispatchToProps)(DashboardGraphSlider);
