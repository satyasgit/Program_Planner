/**
 * Field Mapper Utility for MCP Server
 * Maps JIRA fields between Cloud and Data Center versions
 * Handles custom field transformations and data normalization
 */

class FieldMapper {
  constructor() {
    // Standard field mappings between JIRA Cloud and Data Center
    this.standardFields = {
      // Common fields that exist in both
      summary: 'summary',
      description: 'description',
      issuetype: 'issuetype',
      project: 'project',
      reporter: 'reporter',
      assignee: 'assignee',
      priority: 'priority',
      labels: 'labels',
      components: 'components',
      fixVersions: 'fixVersions',
      versions: 'versions',
      duedate: 'duedate',
      timetracking: 'timetracking',
      security: 'security',
      environment: 'environment',
      
      // Status field (may need transformation)
      status: 'status',
      resolution: 'resolution',
      
      // Date fields
      created: 'created',
      updated: 'updated',
      resolutiondate: 'resolutiondate',
      
      // Work log and comments
      worklog: 'worklog',
      comment: 'comment',
      
      // Attachments
      attachment: 'attachment',
      
      // Links
      issuelinks: 'issuelinks',
      
      // Parent/Epic
      parent: 'parent',
      epic: 'epic',
      
      // Story points (often custom field)
      storyPoints: 'customfield_10001',
      
      // Sprint (often custom field)
      sprint: 'customfield_10002'
    };
    
    // Field type transformations
    this.fieldTypes = {
      string: ['summary', 'description', 'environment'],
      array: ['labels', 'components', 'fixVersions', 'versions', 'attachment'],
      object: ['issuetype', 'project', 'reporter', 'assignee', 'priority', 'status', 'resolution'],
      date: ['created', 'updated', 'duedate', 'resolutiondate'],
      number: ['storyPoints', 'timeoriginalestimate', 'timeestimate', 'timespent']
    };
    
    // Custom field patterns
    this.customFieldPatterns = {
      storyPoints: /story\s*points?|points?/i,
      sprint: /sprint/i,
      epicLink: /epic\s*link/i,
      team: /team/i,
      businessValue: /business\s*value/i,
      tShirtSize: /t-?shirt\s*size|size/i
    };
  }
  
  /**
   * Map fields from source to target format
   * @param {Object} sourceData - Source JIRA data
   * @param {string} sourceType - 'cloud' or 'datacenter'
   * @param {string} targetType - 'cloud' or 'datacenter'
   * @returns {Object} Mapped fields
   */
  mapFields(sourceData, sourceType = 'cloud', targetType = 'datacenter') {
    const mappedData = {};
    
    // Map standard fields
    Object.keys(sourceData).forEach(key => {
      if (this.standardFields[key]) {
        const mappedKey = this.standardFields[key];
        mappedData[mappedKey] = this.transformFieldValue(key, sourceData[key], sourceType, targetType);
      } else if (key.startsWith('customfield_')) {
        // Handle custom fields
        mappedData[key] = sourceData[key];
      }
    });
    
    return mappedData;
  }
  
  /**
   * Transform field value based on field type and target system
   * @param {string} fieldName - Field name
   * @param {*} value - Field value
   * @param {string} sourceType - Source system type
   * @param {string} targetType - Target system type
   * @returns {*} Transformed value
   */
  transformFieldValue(fieldName, value, sourceType, targetType) {
    if (value === null || value === undefined) {
      return value;
    }
    
    // Handle specific field transformations
    switch (fieldName) {
      case 'issuetype':
        return this.transformIssueType(value, sourceType, targetType);
        
      case 'status':
        return this.transformStatus(value, sourceType, targetType);
        
      case 'priority':
        return this.transformPriority(value, sourceType, targetType);
        
      case 'assignee':
      case 'reporter':
        return this.transformUser(value, sourceType, targetType);
        
      case 'project':
        return this.transformProject(value, sourceType, targetType);
        
      case 'components':
      case 'fixVersions':
      case 'versions':
        return this.transformArrayField(value, sourceType, targetType);
        
      case 'sprint':
        return this.transformSprint(value, sourceType, targetType);
        
      default:
        return value;
    }
  }
  
  /**
   * Transform issue type between systems
   */
  transformIssueType(issueType, sourceType, targetType) {
    if (typeof issueType === 'string') {
      return { name: issueType };
    }
    
    return {
      id: issueType.id,
      name: issueType.name,
      subtask: issueType.subtask || false
    };
  }
  
  /**
   * Transform status between systems
   */
  transformStatus(status, sourceType, targetType) {
    if (typeof status === 'string') {
      return { name: status };
    }
    
    return {
      id: status.id,
      name: status.name,
      statusCategory: status.statusCategory || {
        key: this.getStatusCategoryKey(status.name)
      }
    };
  }
  
  /**
   * Get status category key based on status name
   */
  getStatusCategoryKey(statusName) {
    const name = statusName.toLowerCase();
    
    if (name.includes('done') || name.includes('closed') || name.includes('resolved')) {
      return 'done';
    } else if (name.includes('progress') || name.includes('review')) {
      return 'indeterminate';
    } else {
      return 'new';
    }
  }
  
  /**
   * Transform priority between systems
   */
  transformPriority(priority, sourceType, targetType) {
    if (typeof priority === 'string') {
      return { name: priority };
    }
    
    return {
      id: priority.id,
      name: priority.name,
      iconUrl: priority.iconUrl
    };
  }
  
  /**
   * Transform user fields between systems
   */
  transformUser(user, sourceType, targetType) {
    if (!user) return null;
    
    if (typeof user === 'string') {
      return {
        accountId: user,
        displayName: user
      };
    }
    
    // Handle different user object formats
    const transformed = {
      accountId: user.accountId || user.key || user.name,
      displayName: user.displayName || user.name,
      emailAddress: user.emailAddress
    };
    
    // Cloud uses accountId, Data Center might use name/key
    if (targetType === 'datacenter' && !transformed.name) {
      transformed.name = transformed.accountId;
    }
    
    return transformed;
  }
  
  /**
   * Transform project between systems
   */
  transformProject(project, sourceType, targetType) {
    if (typeof project === 'string') {
      return { key: project };
    }
    
    return {
      id: project.id,
      key: project.key,
      name: project.name
    };
  }
  
  /**
   * Transform array fields (components, versions, etc.)
   */
  transformArrayField(items, sourceType, targetType) {
    if (!Array.isArray(items)) {
      return [];
    }
    
    return items.map(item => {
      if (typeof item === 'string') {
        return { name: item };
      }
      
      return {
        id: item.id,
        name: item.name
      };
    });
  }
  
  /**
   * Transform sprint field
   */
  transformSprint(sprint, sourceType, targetType) {
    if (!sprint) return null;
    
    // Sprint data is often stored as a string in custom fields
    if (typeof sprint === 'string') {
      // Parse sprint string format: "com.atlassian.greenhopper.service.sprint.Sprint@1234[id=1,name=Sprint 1,state=ACTIVE]"
      const matches = sprint.match(/\[id=(\d+),name=([^,]+),state=([^\]]+)\]/);
      
      if (matches) {
        return {
          id: parseInt(matches[1]),
          name: matches[2],
          state: matches[3]
        };
      }
      
      return sprint;
    }
    
    return sprint;
  }
  
  /**
   * Find custom field by name pattern
   * @param {Object} fields - Available fields from JIRA
   * @param {string} pattern - Field name pattern to search
   * @returns {string|null} Custom field ID
   */
  findCustomFieldByName(fields, pattern) {
    const regex = this.customFieldPatterns[pattern] || new RegExp(pattern, 'i');
    
    for (const [fieldId, fieldInfo] of Object.entries(fields)) {
      if (fieldId.startsWith('customfield_') && regex.test(fieldInfo.name)) {
        return fieldId;
      }
    }
    
    return null;
  }
  
  /**
   * Normalize field value for consistent handling
   * @param {*} value - Field value
   * @param {string} fieldType - Expected field type
   * @returns {*} Normalized value
   */
  normalizeFieldValue(value, fieldType) {
    switch (fieldType) {
      case 'string':
        return value ? String(value) : '';
        
      case 'number':
        return value ? Number(value) : 0;
        
      case 'boolean':
        return Boolean(value);
        
      case 'array':
        return Array.isArray(value) ? value : [];
        
      case 'object':
        return value && typeof value === 'object' ? value : {};
        
      case 'date':
        return value ? new Date(value).toISOString() : null;
        
      default:
        return value;
    }
  }
  
  /**
   * Validate required fields for issue creation/update
   * @param {Object} fields - Fields to validate
   * @param {Array} requiredFields - List of required field names
   * @returns {Object} Validation result
   */
  validateRequiredFields(fields, requiredFields = ['summary', 'project', 'issuetype']) {
    const missing = [];
    const invalid = [];
    
    requiredFields.forEach(fieldName => {
      if (!fields[fieldName]) {
        missing.push(fieldName);
      } else if (fieldName === 'project' && !fields[fieldName].key && !fields[fieldName].id) {
        invalid.push(`${fieldName}: must have either 'key' or 'id'`);
      } else if (fieldName === 'issuetype' && !fields[fieldName].name && !fields[fieldName].id) {
        invalid.push(`${fieldName}: must have either 'name' or 'id'`);
      }
    });
    
    return {
      valid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid
    };
  }
  
  /**
   * Get field metadata for better mapping
   * @param {string} fieldName - Field name
   * @returns {Object} Field metadata
   */
  getFieldMetadata(fieldName) {
    let fieldType = 'string';
    
    // Determine field type
    for (const [type, fields] of Object.entries(this.fieldTypes)) {
      if (fields.includes(fieldName)) {
        fieldType = type;
        break;
      }
    }
    
    return {
      name: fieldName,
      type: fieldType,
      isCustom: fieldName.startsWith('customfield_'),
      isRequired: ['summary', 'project', 'issuetype'].includes(fieldName)
    };
  }
}

// Create singleton instance
const fieldMapper = new FieldMapper();

module.exports = fieldMapper;
module.exports.FieldMapper = FieldMapper;