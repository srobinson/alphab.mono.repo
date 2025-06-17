import type { SupabaseClient } from "@supabase/supabase-js";
import type { Permission } from "./types";
// Simple console logging for Node.js compatibility
const logger = {
  info: (msg: string, ctx?: any) => console.log(`ℹ️ [permissions] ${msg}`, ctx || ""),
  error: (msg: string, ctx?: any) => console.error(`❌ [permissions] ${msg}`, ctx || ""),
  warn: (msg: string, ctx?: any) => console.warn(`⚠️ [permissions] ${msg}`, ctx || ""),
  debug: (msg: string, ctx?: any) => console.debug(`🔍 [permissions] ${msg}`, ctx || ""),
};

/**
 * Permission manager for resource access control
 */
export class PermissionManager {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  /**
   * Grant permission to a user for a resource
   */
  async grantPermission(
    resourceType: string,
    resourceId: string,
    userId: string,
    permissionType: string,
    grantedBy?: string,
    expiresAt?: string,
  ): Promise<Permission> {
    try {
      const permission: Omit<Permission, "id"> = {
        resource_type: resourceType,
        resource_id: resourceId,
        user_id: userId,
        permission_type: permissionType,
        granted_by: grantedBy || null,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt || null,
      };

      const { data, error } = await this.client
        .from("permissions")
        .insert(permission)
        .select()
        .single();

      if (error) {
        logger.error("Failed to grant permission", { permission, error });
        throw error;
      }

      return data as Permission;
    } catch (error) {
      logger.error("Permission grant failed", {
        resourceType,
        resourceId,
        userId,
        permissionType,
        error,
      });
      throw error;
    }
  }

  /**
   * Revoke permission from a user for a resource
   */
  async revokePermission(
    resourceType: string,
    resourceId: string,
    userId: string,
    permissionType: string,
  ): Promise<void> {
    try {
      const { error } = await this.client
        .from("permissions")
        .delete()
        .eq("resource_type", resourceType)
        .eq("resource_id", resourceId)
        .eq("user_id", userId)
        .eq("permission_type", permissionType);

      if (error) {
        logger.error("Failed to revoke permission", {
          resourceType,
          resourceId,
          userId,
          permissionType,
          error,
        });
        throw error;
      }
    } catch (error) {
      logger.error("Permission revocation failed", {
        resourceType,
        resourceId,
        userId,
        permissionType,
        error,
      });
      throw error;
    }
  }

  /**
   * Check if a user has permission for a resource
   */
  async hasPermission(
    resourceType: string,
    resourceId: string,
    userId: string,
    permissionType: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from("permissions")
        .select("id")
        .eq("resource_type", resourceType)
        .eq("resource_id", resourceId)
        .eq("user_id", userId)
        .eq("permission_type", permissionType)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1);

      if (error) {
        logger.error("Failed to check permission", {
          resourceType,
          resourceId,
          userId,
          permissionType,
          error,
        });
        throw error;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      logger.error("Permission check failed", {
        resourceType,
        resourceId,
        userId,
        permissionType,
        error,
      });
      return false;
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const { data, error } = await this.client
        .from("permissions")
        .select("*")
        .eq("user_id", userId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      if (error) {
        logger.error("Failed to get user permissions", { userId, error });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error("User permissions retrieval failed", { userId, error });
      throw error;
    }
  }

  /**
   * Get all permissions for a resource
   */
  async getResourcePermissions(resourceType: string, resourceId: string): Promise<Permission[]> {
    try {
      const { data, error } = await this.client
        .from("permissions")
        .select("*")
        .eq("resource_type", resourceType)
        .eq("resource_id", resourceId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      if (error) {
        logger.error("Failed to get resource permissions", { resourceType, resourceId, error });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error("Resource permissions retrieval failed", { resourceType, resourceId, error });
      throw error;
    }
  }

  /**
   * Clean up expired permissions
   */
  async cleanupExpiredPermissions(): Promise<number> {
    try {
      const { data, error } = await this.client
        .from("permissions")
        .delete()
        .lt("expires_at", new Date().toISOString())
        .select("id");

      if (error) {
        logger.error("Failed to cleanup expired permissions", { error });
        throw error;
      }

      const deletedCount = data?.length || 0;
      logger.info("Cleaned up expired permissions", { deletedCount });

      return deletedCount;
    } catch (error) {
      logger.error("Permission cleanup failed", { error });
      throw error;
    }
  }

  /**
   * Update permission expiration
   */
  async updatePermissionExpiration(
    resourceType: string,
    resourceId: string,
    userId: string,
    permissionType: string,
    expiresAt: string | null,
  ): Promise<void> {
    try {
      const { error } = await this.client
        .from("permissions")
        .update({ expires_at: expiresAt })
        .eq("resource_type", resourceType)
        .eq("resource_id", resourceId)
        .eq("user_id", userId)
        .eq("permission_type", permissionType);

      if (error) {
        logger.error("Failed to update permission expiration", {
          resourceType,
          resourceId,
          userId,
          permissionType,
          expiresAt,
          error,
        });
        throw error;
      }
    } catch (error) {
      logger.error("Permission expiration update failed", {
        resourceType,
        resourceId,
        userId,
        permissionType,
        expiresAt,
        error,
      });
      throw error;
    }
  }
}

/**
 * Create a permission manager instance
 */
export function createPermissionManager(client: SupabaseClient): PermissionManager {
  return new PermissionManager(client);
}

/**
 * Common permission types
 */
export const PermissionTypes = {
  READ: "read",
  WRITE: "write",
  DELETE: "delete",
  ADMIN: "admin",
  OWNER: "owner",
} as const;

/**
 * Common resource types
 */
export const ResourceTypes = {
  VAULT: "vault",
  ARTIFACT: "artifact",
  CONTENT_PRODUCT: "content_product",
  USER: "user",
} as const;

/**
 * Helper function to check multiple permissions at once
 */
export async function checkPermissions(
  client: SupabaseClient,
  userId: string,
  checks: Array<{
    resourceType: string;
    resourceId: string;
    permissionType: string;
  }>,
): Promise<Record<string, boolean>> {
  const permissionManager = createPermissionManager(client);
  const results: Record<string, boolean> = {};

  for (const check of checks) {
    const key = `${check.resourceType}:${check.resourceId}:${check.permissionType}`;
    results[key] = await permissionManager.hasPermission(
      check.resourceType,
      check.resourceId,
      userId,
      check.permissionType,
    );
  }

  return results;
}

/**
 * Permission middleware for checking access
 */
export async function requirePermission(
  permissionManager: PermissionManager,
  resourceType: string,
  resourceId: string,
  userId: string,
  permissionType: string,
): Promise<void> {
  const hasAccess = await permissionManager.hasPermission(
    resourceType,
    resourceId,
    userId,
    permissionType,
  );

  if (!hasAccess) {
    throw new Error(
      `Access denied: User ${userId} does not have ${permissionType} permission for ${resourceType}:${resourceId}`,
    );
  }
}

/**
 * Permission decorator for functions
 */
export function withPermissionCheck(
  permissionManager: PermissionManager,
  resourceType: string,
  resourceId: string,
  permissionType: string,
) {
  return function <T extends (...args: any[]) => Promise<any>>(
    // @expect-error - Used by TypeScript's decorator metadata
    target: any,
    // @expect-error - Used by TypeScript's decorator metadata
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const originalMethod = descriptor.value;

    if (!originalMethod) {
      return descriptor;
    }

    descriptor.value = async function (this: any, ...args: any[]) {
      // Assume first argument contains userId
      const userId = args[0]?.userId || args[0]?.user_id;

      if (!userId) {
        throw new Error("User ID is required for permission check");
      }

      await requirePermission(permissionManager, resourceType, resourceId, userId, permissionType);

      return originalMethod.apply(this, args);
    } as T;

    return descriptor;
  };
}
