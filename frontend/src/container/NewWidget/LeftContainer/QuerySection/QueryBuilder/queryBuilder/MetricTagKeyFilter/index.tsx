import { CloseCircleFilled } from '@ant-design/icons';
import { useMachine } from '@xstate/react';
import { Button, Select, Spin } from 'antd';
import { useIsDarkMode } from 'hooks/useDarkMode';
import { map } from 'lodash-es';
import React, { useCallback, useEffect, useState } from 'react';
import { IMetricsBuilderQuery } from 'types/api/dashboard/getAll';
import { v4 as uuid } from 'uuid';

import { ResourceAttributesFilterMachine } from './MetricTagKey.machine';
import QueryChip from './QueryChip';
import { QueryChipItem, SearchContainer } from './styles';
import { IOption, ITagKeyValueQuery } from './types';
import {
	createQuery,
	GetTagKeys,
	GetTagValues,
	OperatorSchema,
	SingleValueOperators,
} from './utils';

interface IMetricTagKeyFilterProps {
	metricName: IMetricsBuilderQuery['metricName'];
	onSetQuery: (args: IMetricsBuilderQuery['tagFilters']['items']) => void;
	selectedTagFilters: IMetricsBuilderQuery['tagFilters']['items'];
}

function MetricTagKeyFilter({
	metricName,
	onSetQuery,
	selectedTagFilters: selectedTagQueries,
}: IMetricTagKeyFilterProps): JSX.Element | null {
	const isDarkMode = useIsDarkMode();
	const [loading, setLoading] = useState(true);
	const [selectedValues, setSelectedValues] = useState<string[]>([]);
	const [staging, setStaging] = useState<string[]>([]);
	const [queries, setQueries] = useState<ITagKeyValueQuery[]>([]);
	const [optionsData, setOptionsData] = useState<{
		mode: undefined | 'tags' | 'multiple';
		options: IOption[];
	}>({
		mode: undefined,
		options: [],
	});

	const dispatchQueries = (
		updatedQueries: IMetricsBuilderQuery['tagFilters']['items'],
	): void => {
		onSetQuery(updatedQueries);
		setQueries(updatedQueries);
	};
	const handleLoading = (isLoading: boolean): void => {
		setLoading(isLoading);
		if (isLoading) {
			setOptionsData({ mode: undefined, options: [] });
		}
	};
	const [state, send] = useMachine(ResourceAttributesFilterMachine, {
		actions: {
			onSelectTagKey: () => {
				handleLoading(true);
				GetTagKeys(metricName || '')
					.then((tagKeys) => setOptionsData({ options: tagKeys, mode: undefined }))
					.finally(() => {
						handleLoading(false);
					});
			},
			onSelectOperator: () => {
				setOptionsData({ options: OperatorSchema, mode: undefined });
			},
			onSelectTagValue: () => {
				handleLoading(true);

				GetTagValues(staging[0], metricName || '')
					.then((tagValuesOptions) =>
						setOptionsData({ options: tagValuesOptions, mode: 'tags' }),
					)
					.finally(() => {
						handleLoading(false);
					});
			},
			onBlurPurge: () => {
				setSelectedValues([]);
				setStaging([]);
			},
			onValidateQuery: (): void => {
				if (staging.length < 2 || selectedValues.length === 0) {
					return;
				}

				const generatedQuery = createQuery([...staging, selectedValues]);

				if (generatedQuery) {
					dispatchQueries([...queries, generatedQuery]);
					setSelectedValues([]);
					setStaging([]);
					send('RESET');
				}
			},
		},
	});

	useEffect(() => {
		setQueries(selectedTagQueries);
	}, [selectedTagQueries]);

	const handleFocus = (): void => {
		if (state.value === 'Idle') {
			send('NEXT');
		}
	};

	const handleBlur = useCallback((): void => {
		send('onBlur');
	}, [send]);

	useEffect(() => {
		handleBlur();
	}, [handleBlur, metricName]);

	const handleChange = (value: never | string[]): void => {
		if (!optionsData.mode) {
			setStaging((prevStaging) => [...prevStaging, String(value)]);
			setSelectedValues([]);
			send('NEXT');
			return;
		}
		if (
			state.value === 'TagValue' &&
			SingleValueOperators.includes(staging[staging.length - 1]) &&
			Array.isArray(value)
		) {
			setSelectedValues([value[value.length - 1]]);
			return;
		}

		setSelectedValues([...value]);
	};

	const handleClose = (id: string): void => {
		dispatchQueries(queries.filter((queryData) => queryData.id !== id));
	};

	const handleClearAll = (): void => {
		send('RESET');
		dispatchQueries([]);
		setStaging([]);
		setSelectedValues([]);
	};

	return (
		<SearchContainer isDarkMode={isDarkMode}>
			<div style={{ display: 'inline-flex', flexWrap: 'wrap' }}>
				{queries.length > 0 &&
					map(
						queries,
						(query): JSX.Element => (
							<QueryChip key={query.id} queryData={query} onClose={handleClose} />
						),
					)}
			</div>
			<div>
				{map(staging, (item) => (
					<QueryChipItem key={uuid()}>{item}</QueryChipItem>
				))}
			</div>

			<div style={{ display: 'flex', width: '100%' }}>
				<Select
					disabled={!metricName}
					placeholder={`Select ${
						state.value === 'Idle' ? 'Tag Key Pair' : state.value
					}`}
					onChange={handleChange}
					bordered={false}
					value={selectedValues as never}
					style={{ flex: 1 }}
					options={optionsData.options}
					mode={optionsData?.mode}
					showArrow={false}
					onFocus={handleFocus}
					onBlur={handleBlur}
					notFoundContent={
						loading ? (
							<span>
								<Spin size="small" /> Loading...{' '}
							</span>
						) : (
							<span>
								No resource attributes available to filter. Please refer docs to send
								attributes.
							</span>
						)
					}
				/>

				{queries.length || staging.length || selectedValues.length ? (
					<Button
						onClick={handleClearAll}
						icon={<CloseCircleFilled />}
						type="text"
					/>
				) : null}
			</div>
		</SearchContainer>
	);
}

export default MetricTagKeyFilter;
