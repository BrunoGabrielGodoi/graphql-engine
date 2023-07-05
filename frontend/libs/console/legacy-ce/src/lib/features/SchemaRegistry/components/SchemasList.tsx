import React from 'react';
import { SchemaRow } from './SchemaRow';
import { useGetSchemaList } from '../hooks/useGetSchemaList';
import { Button } from '../../../new-components/Button';
import { Schema, RoleBasedSchema, SchemaRegistryTag } from '../types';
import { useDispatch } from 'react-redux';
import _push from '../../../components/Services/Data/push';
import globals from '../../../Globals';
import { schemaListTransformFn, getPublishTime } from '../utils';
import { FaPlusCircle } from 'react-icons/fa';
import { AddSchemaRegistryTagDialog } from './AddSchemaRegistryTagDialog';
import { IconTooltip } from '../../../new-components/Tooltip';
import { SchemaTag } from './SchemaTag';
import { Analytics } from '../../Analytics';

export const SchemasList = () => {
  const projectID = globals.hasuraCloudProjectId || '';
  const fetchSchemaResponse = useGetSchemaList(projectID);

  const { kind } = fetchSchemaResponse;

  switch (kind) {
    case 'loading':
      return <p>Loading...</p>;
    case 'error':
      return <p>Error: {fetchSchemaResponse.message}</p>;
    case 'success': {
      const schemaList = schemaListTransformFn(fetchSchemaResponse.response);

      return (
        <Tabularised
          schemas={schemaList}
          loadMore={fetchSchemaResponse.loadMore}
          isLoadingMore={fetchSchemaResponse.isLoadingMore}
          shouldLoadMore={fetchSchemaResponse.shouldLoadMore}
        />
      );
    }
  }
};

export const Tabularised: React.VFC<{
  schemas: Schema[];
  loadMore: VoidFunction;
  isLoadingMore: boolean;
  shouldLoadMore: boolean;
}> = props => {
  const { schemas, loadMore, isLoadingMore, shouldLoadMore } = props;

  return (
    <div className="overflow-x-auto rounded-sm border-neutral-200 bg-gray-100 border w-3/5">
      <div className="w-full flex bg-gray-100 px-4 py-2">
        <div className="flex text-base w-[69%] justify-start">
          <span className="text-sm font-bold">SCHEMA</span>
        </div>
        <div className="flex text-base w-[28%] justify-between">
          <span className="text-sm font-bold">BREAKING</span>
          <span className="text-sm font-bold">DANGEROUS</span>
          <span className="text-sm font-bold">SAFE</span>
        </div>
      </div>
      <div className="flex flex-col w-full">
        {schemas.length ? (
          <div className="mb-md">
            {schemas.map(schema => (
              <SchemaCard
                createdAt={schema.created_at}
                hash={schema.entry_hash}
                roleBasedSchemas={schema.roleBasedSchemas}
                tags={schema.tags}
              />
            ))}
            {shouldLoadMore && (
              <div className="flex w-full justify-center items-center">
                <Button
                  onClick={e => {
                    e.preventDefault();
                    loadMore();
                  }}
                  isLoading={isLoadingMore}
                  disabled={isLoadingMore}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="white border-t border-neutral-200">
            <div className="p-xs" data-test="label-no-domain-found">
              No schemas published to the schema registry yet
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SchemaCard: React.VFC<{
  createdAt: string;
  hash: string;
  roleBasedSchemas: RoleBasedSchema[];
  tags: SchemaRegistryTag[];
}> = props => {
  const { createdAt, hash, roleBasedSchemas, tags } = props;
  const [isTagModalOpen, setIsTagModalOpen] = React.useState(false);

  const [tagsList, setTagsList] = React.useState<SchemaRegistryTag[]>(tags);

  const dispatch = useDispatch();

  const onRemoveTag = (id: string) => {
    const filteredTags = tagsList.filter(
      schemaRegistryTag => schemaRegistryTag.id !== id
    );
    setTagsList(filteredTags);
  };

  return (
    <div className="w-full flex-col px-4 py-2 mb-2 bg-white">
      {isTagModalOpen && (
        <AddSchemaRegistryTagDialog
          tagsList={tagsList}
          setTagsList={setTagsList}
          entryHash={hash}
          onClose={() => {
            setIsTagModalOpen(false);
          }}
        />
      )}
      <div className="flex justify-start">
        <div className="ml-[-8px]">
          {tagsList &&
            tagsList.map(schemaRegistryTag => (
              <div className="inline-flex mr-2">
                <SchemaTag
                  schemaRegistryTag={schemaRegistryTag}
                  onRemove={onRemoveTag}
                />
              </div>
            ))}
        </div>
        <Analytics name="schema-registry-add-tag-btn">
          <div className="mt-[5px]" onClick={() => setIsTagModalOpen(true)}>
            <IconTooltip message="Add a Tag" icon={<FaPlusCircle />} />
          </div>
        </Analytics>
      </div>

      <div className="flex flex-col w-full">
        <div className="flex mt-4">
          <div className="flex-col w-1/2">
            <div className="font-bold text-gray-500">Published</div>
            <span>{getPublishTime(createdAt)}</span>
          </div>
          <div className="flex-col w-1/2">
            <div className="font-bold text-gray-500">Hash</div>
            <span className="font-bold bg-gray-100 px-1 rounded text-sm">
              {hash}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-col w-full mt-8">
        <div className="font-bold text-gray-500">Roles</div>
        {roleBasedSchemas.length ? (
          roleBasedSchemas.map((roleBasedSchema, index) => (
            <div className="flex-col w-full">
              <SchemaRow
                role={roleBasedSchema.role || ''}
                changes={roleBasedSchema.changes}
                onClick={() => {
                  dispatch(
                    _push(`/settings/schema-registry/${roleBasedSchema.id}`)
                  );
                }}
              />
              {!(index + 1 === roleBasedSchemas.length) ? (
                <div className="flex w-full border-b border-gray-300" />
              ) : null}
            </div>
          ))
        ) : (
          <div className="white border-t border-neutral-200">
            <div className="p-xs" data-test="label-no-domain-found">
              No schemas published to the schema registry yet
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
