import { Select } from 'antd';
import { BaseOptionType } from 'antd/es/select';
import getTagValue from 'api/trace/getTagValue';
import React, { useCallback, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import { GlobalReducer } from 'types/reducer/globalTime';
import { TraceReducer } from 'types/reducer/trace';

import { SelectComponent } from './styles';
import {
	disableTagValue,
	extractTagKey,
	extractTagType,
	getInitialLocalValue,
	getTagValueOptions,
	onTagValueChange,
	selectOptions,
	TagValueTypes,
} from './utils';

function TagValue(props: TagValueProps): JSX.Element {
	const { tag, setLocalSelectedTags, index, tagKey } = props;
	const {
		Key: selectedKey,
		Operator: selectedOperator,
		StringValues: selectedStringValues,
		NumberValues: selectedNumberValues,
		BoolValues: selectedBoolValues,
	} = tag;

	const [localTagValue, setLocalTagValue] = useState<TagValueTypes[]>(
		getInitialLocalValue(
			selectedNumberValues,
			selectedBoolValues,
			selectedStringValues,
		),
	);

	const globalReducer = useSelector<AppState, GlobalReducer>(
		(state) => state.globalTime,
	);

	const tagType = useMemo(() => extractTagType(tagKey), [tagKey]);

	const { isLoading, data } = useQuery(
		['tagKey', globalReducer.minTime, globalReducer.maxTime, tagKey, tagType],
		{
			queryFn: () =>
				getTagValue({
					end: globalReducer.maxTime,
					start: globalReducer.minTime,
					tagKey: {
						Key: extractTagKey(tagKey),
						Type: tagType,
					},
				}),
		},
	);

	const tagValueDisabled = useMemo(
		() =>
			disableTagValue(
				selectedOperator,
				setLocalTagValue,
				selectedKey,
				setLocalSelectedTags,
				index,
			),
		[index, selectedKey, selectedOperator, setLocalSelectedTags],
	);

	const onSetLocalValue = useCallback(() => {
		setLocalTagValue([]);
	}, []);

	const onSelectedHandler = useCallback(
		(value: unknown) => {
			if (
				typeof value === 'number' ||
				(typeof value === 'string' && !Number.isNaN(Number(value)) && value !== ' ')
			) {
				setLocalTagValue([value]);
				setLocalSelectedTags((tags) => [
					...tags.slice(0, index),
					{
						Key: selectedKey,
						Operator: selectedOperator,
						StringValues: [],
						NumberValues: [Number(value)],
						BoolValues: [],
					},
					...tags.slice(index + 1, tags.length),
				]);
			} else if (
				typeof value === 'boolean' ||
				value === 'true' ||
				value === 'false'
			) {
				setLocalTagValue([value]);
				setLocalSelectedTags((tags) => [
					...tags.slice(0, index),
					{
						Key: selectedKey,
						Operator: selectedOperator,
						StringValues: [],
						NumberValues: [],
						BoolValues: [value === 'true' || value === true],
					},
					...tags.slice(index + 1, tags.length),
				]);
			} else if (typeof value === 'string') {
				setLocalTagValue([value]);
				setLocalSelectedTags((tags) => [
					...tags.slice(0, index),
					{
						Key: selectedKey,
						Operator: selectedOperator,
						StringValues: [value],
						NumberValues: [],
						BoolValues: [],
					},
					...tags.slice(index + 1, tags.length),
				]);
			}
		},
		[index, selectedKey, selectedOperator, setLocalSelectedTags],
	);

	const onChangeHandler = useCallback(
		(value: unknown) => onTagValueChange(value, setLocalTagValue),
		[],
	);

	const getFilterOptions = useCallback(
		(inputValue: string, option?: BaseOptionType): boolean => {
			if (typeof option?.label === 'string') {
				return option?.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1;
			}
			return false;
		},
		[],
	);

	return (
		<SelectComponent
			loading={isLoading}
			options={getTagValueOptions(data?.payload, tagType)}
			mode="tags"
			allowClear
			onClear={onSetLocalValue}
			onDeselect={onSetLocalValue}
			showSearch
			filterOption={getFilterOptions}
			disabled={isLoading || tagValueDisabled}
			value={localTagValue}
			onChange={onChangeHandler}
			onSelect={onSelectedHandler}
		>
			{selectOptions(data?.payload, tagType)?.map((suggestion) => (
				<Select.Option key={suggestion.toString()} value={suggestion}>
					{suggestion}
				</Select.Option>
			))}
		</SelectComponent>
	);
}

interface TagValueProps {
	index: number;
	tag: FlatArray<TraceReducer['selectedTags'], 1>;
	setLocalSelectedTags: React.Dispatch<
		React.SetStateAction<TraceReducer['selectedTags']>
	>;
	tagKey: string;
}

export default TagValue;
