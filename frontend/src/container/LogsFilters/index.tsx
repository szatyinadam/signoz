import { CloseOutlined, PlusCircleFilled } from '@ant-design/icons';
import { Input } from 'antd';
import CategoryHeading from 'components/Logs/CategoryHeading';
import { fieldSearchFilter } from 'lib/logs/fieldSearch';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import { ILogsReducer } from 'types/reducer/logs';

import { ICON_STYLE } from './config';
import FieldItem from './FieldItem';
import { CategoryContainer, Container, FieldContainer } from './styles';
import { IHandleInterestProps, IHandleRemoveInterestProps } from './types';
import { onHandleAddInterest, onHandleRemoveInterest } from './utils';

function LogsFilters(): JSX.Element {
	const {
		fields: { interesting, selected },
	} = useSelector<AppState, ILogsReducer>((state) => state.logs);

	const [selectedFieldLoading, setSelectedFieldLoading] = useState<number[]>([]);
	const [interestingFieldLoading, setInterestingFieldLoading] = useState<
		number[]
	>([]);

	const [filterValuesInput, setFilterValuesInput] = useState('');
	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
		setFilterValuesInput((e.target as HTMLInputElement).value);
	};

	const onHandleAddSelectedToInteresting = useCallback(
		({ fieldData, fieldIndex }: IHandleInterestProps) => (): Promise<void> =>
			onHandleAddInterest({
				fieldData,
				fieldIndex,
				interesting,
				interestingFieldLoading,
				setInterestingFieldLoading,
				selected,
			}),
		[interesting, interestingFieldLoading, selected],
	);

	const onHandleRemoveSelected = useCallback(
		({
			fieldData,
			fieldIndex,
		}: IHandleRemoveInterestProps) => (): Promise<void> =>
			onHandleRemoveInterest({
				fieldData,
				fieldIndex,
				interesting,
				interestingFieldLoading,
				selected,
				setSelectedFieldLoading,
			}),
		[interesting, interestingFieldLoading, selected, setSelectedFieldLoading],
	);

	return (
		<Container flex="450px">
			<Input
				placeholder="Filter Values"
				onInput={handleSearch}
				value={filterValuesInput}
				onChange={handleSearch}
			/>

			<CategoryContainer>
				<CategoryHeading>SELECTED FIELDS</CategoryHeading>
				<FieldContainer>
					{selected
						.filter((field) => fieldSearchFilter(field.name, filterValuesInput))
						.map((field, idx) => (
							<FieldItem
								key={`${JSON.stringify(field)}`}
								name={field.name}
								fieldData={field}
								fieldIndex={idx}
								buttonIcon={<CloseOutlined style={ICON_STYLE.CLOSE} />}
								buttonOnClick={onHandleRemoveSelected({
									fieldData: field,
									fieldIndex: idx,
								})}
								isLoading={selectedFieldLoading.includes(idx)}
								iconHoverText="Remove from Selected Fields"
							/>
						))}
				</FieldContainer>
			</CategoryContainer>
			<CategoryContainer>
				<CategoryHeading>INTERESTING FIELDS</CategoryHeading>
				<FieldContainer>
					{interesting
						.filter((field) => fieldSearchFilter(field.name, filterValuesInput))
						.map((field, idx) => (
							<FieldItem
								key={`${JSON.stringify(field)}`}
								name={field.name}
								fieldData={field}
								fieldIndex={idx}
								buttonIcon={<PlusCircleFilled style={ICON_STYLE.PLUS} />}
								buttonOnClick={onHandleAddSelectedToInteresting({
									fieldData: field,
									fieldIndex: idx,
								})}
								isLoading={interestingFieldLoading.includes(idx)}
								iconHoverText="Add to Selected Fields"
							/>
						))}
				</FieldContainer>
			</CategoryContainer>
		</Container>
	);
}

export default LogsFilters;
