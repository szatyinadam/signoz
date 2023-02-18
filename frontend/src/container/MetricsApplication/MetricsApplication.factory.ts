import { Widgets } from 'types/api/dashboard/getAll';
import { v4 } from 'uuid';

export const getWidgetQueryBuilder = (query: Widgets['query']): Widgets => ({
	description: '',
	id: v4(),
	isStacked: false,
	nullZeroValues: '',
	opacity: '0',
	panelTypes: 'TIME_SERIES',
	query,
	queryData: {
		data: { queryData: [] },
		error: false,
		errorMessage: '',
		loading: false,
	},
	timePreferance: 'GLOBAL_TIME',
	title: '',
});
