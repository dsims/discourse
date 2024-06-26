import { action } from "@ember/object";
import { service } from "@ember/service";
import BulkTopicActions, {
  addBulkDropdownAction,
} from "discourse/components/modal/bulk-topic-actions";
import i18n from "discourse-common/helpers/i18n";
import DropdownSelectBoxComponent from "select-kit/components/dropdown-select-box";

const _customButtons = [];
const _customOnSelection = {};

export function addBulkDropdownButton(opts) {
  _customButtons.push({
    id: opts.label,
    icon: opts.icon,
    name: i18n(opts.label),
    visible: opts.visible,
  });
  addBulkDropdownAction(opts.label, opts.action);
  const actionOpts = {
    label: opts.label,
    setComponent: true,
  };
  if (opts.actionType === "performAndRefresh") {
    actionOpts.setComponent = false;
  }
  _customOnSelection[opts.label] = actionOpts;
}

export default DropdownSelectBoxComponent.extend({
  classNames: ["bulk-select-topics-dropdown"],
  headerIcon: null,
  showFullTitle: true,
  selectKitOptions: {
    showCaret: true,
    showFullTitle: true,
    none: "select_kit.components.bulk_select_topics_dropdown.title",
  },

  modal: service(),
  router: service(),
  currentUser: service(),
  siteSettings: service(),

  computeContent() {
    let options = [];
    options = options.concat([
      {
        id: "update-category",
        icon: "pencil-alt",
        name: i18n("topic_bulk_actions.update_category.name"),
      },
      {
        id: "update-notifications",
        icon: "d-regular",
        name: i18n("topic_bulk_actions.update_notifications.name"),
      },
      {
        id: "reset-bump-dates",
        icon: "anchor",
        name: i18n("topic_bulk_actions.reset_bump_dates.name"),
      },
      {
        id: "defer",
        icon: "circle",
        name: i18n("topic_bulk_actions.defer.name"),
        visible: ({ currentUser }) => currentUser.user_option.enable_defer,
      },
      {
        id: "close-topics",
        icon: "lock",
        name: i18n("topic_bulk_actions.close_topics.name"),
      },
      {
        id: "archive-topics",
        icon: "folder",
        name: i18n("topic_bulk_actions.archive_topics.name"),
      },
      {
        id: "unlist-topics",
        icon: "far-eye-slash",
        name: i18n("topic_bulk_actions.unlist_topics.name"),
        visible: ({ topics }) =>
          topics.some((t) => t.visible) &&
          !topics.some((t) => t.isPrivateMessage),
      },
      {
        id: "relist-topics",
        icon: "far-eye",
        name: i18n("topic_bulk_actions.relist_topics.name"),
        visible: ({ topics }) =>
          topics.some((t) => !t.visible) &&
          !topics.some((t) => t.isPrivateMessage),
      },
      {
        id: "append-tags",
        icon: "tag",
        name: i18n("topic_bulk_actions.append_tags.name"),
        visible: ({ currentUser, siteSettings }) =>
          siteSettings.tagging_enabled && currentUser.canManageTopic,
      },
      {
        id: "replace-tags",
        icon: "tag",
        name: i18n("topic_bulk_actions.replace_tags.name"),
        visible: ({ currentUser, siteSettings }) =>
          siteSettings.tagging_enabled && currentUser.canManageTopic,
      },
      {
        id: "remove-tags",
        icon: "tag",
        name: i18n("topic_bulk_actions.remove_tags.name"),
        visible: ({ currentUser, siteSettings }) =>
          siteSettings.tagging_enabled && currentUser.canManageTopic,
      },
      {
        id: "delete-topics",
        icon: "trash-alt",
        name: i18n("topic_bulk_actions.delete_topics.name"),
        visible: ({ currentUser }) => currentUser.staff,
      },
    ]);

    return [...options, ..._customButtons].filter(({ visible }) => {
      if (visible) {
        return visible({
          topics: this.bulkSelectHelper.selected,
          currentUser: this.currentUser,
          siteSettings: this.siteSettings,
        });
      } else {
        return true;
      }
    });
  },

  showBulkTopicActionsModal(actionName, title, opts = {}) {
    let allowSilent = false;
    let initialAction = null;
    let initialActionLabel = null;
    let description = null;
    if (opts.allowSilent === true) {
      allowSilent = true;
    }
    if (opts.custom === true) {
      title = i18n(_customOnSelection[actionName].label);
      initialActionLabel = actionName;
      if (opts.setComponent === true) {
        initialAction = "set-component";
      }
    } else {
      title = i18n(`topics.bulk.${title}`);
    }
    if (opts.description) {
      description = opts.description;
    }

    this.modal.show(BulkTopicActions, {
      model: {
        action: actionName,
        title,
        description,
        bulkSelectHelper: this.bulkSelectHelper,
        refreshClosure: () => this.router.refresh(),
        allowSilent,
        initialAction,
        initialActionLabel,
      },
    });
  },

  @action
  onSelect(id) {
    switch (id) {
      case "update-category":
        this.showBulkTopicActionsModal(id, "change_category", {
          description: i18n(`topic_bulk_actions.update_category.description`),
        });
        break;
      case "update-notifications":
        this.showBulkTopicActionsModal(id, "notification_level", {
          description: i18n(
            `topic_bulk_actions.update_notifications.description`
          ),
        });
        break;
      case "close-topics":
        this.showBulkTopicActionsModal("close", "close_topics", {
          allowSilent: true,
        });
        break;
      case "archive-topics":
        this.showBulkTopicActionsModal("archive", "archive_topics");
        break;
      case "unlist-topics":
        this.showBulkTopicActionsModal("unlist", "unlist_topics");
        break;
      case "relist-topics":
        this.showBulkTopicActionsModal("relist", "relist_topics");
        break;
      case "append-tags":
        this.showBulkTopicActionsModal(id, "choose_append_tags");
        break;
      case "replace-tags":
        this.showBulkTopicActionsModal(id, "change_tags");
        break;
      case "remove-tags":
        this.showBulkTopicActionsModal(id, "remove_tags");
        break;
      case "delete-topics":
        this.showBulkTopicActionsModal("delete", "delete");
        break;
      case "reset-bump-dates":
        this.showBulkTopicActionsModal(id, "reset_bump_dates", {
          description: i18n(`topic_bulk_actions.reset_bump_dates.description`),
        });
        break;
      case "defer":
        this.showBulkTopicActionsModal(id, "defer", {
          description: i18n(`topic_bulk_actions.defer.description`),
        });
        break;
      default:
        if (_customOnSelection[id]) {
          this.showBulkTopicActionsModal(id, _customOnSelection[id].label, {
            custom: true,
            setComponent: _customOnSelection[id].setComponent,
          });
        }
    }
  },
});
