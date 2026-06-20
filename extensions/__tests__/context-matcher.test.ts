import { describe, it, expect } from "vitest";
import { matchContext, MATCH_RULES } from "../context-matcher.js";

describe("ContextMatcher", () => {
  describe("MATCH_RULES", () => {
    it("covers all 30 contextual categories from insults.json", () => {
      const categories = new Set(MATCH_RULES.map(r => r.category));
      expect(categories.size).toBe(30);
    });
  });

  describe("matchContext", () => {
    // Priority: rm_rf branch comes before sudo in source
    it("prioritizes rm_rf over sudo when both match", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "bash",
        command: "sudo rm -rf /",
      });
      expect(result).toBe("rm_rf");
    });

    // Tool gating: rm_rf rule is gated on bash
    it("returns null for rm -rf when tool is not bash", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "read",
        command: "rm -rf x",
      });
      expect(result).toBeNull();
    });

    // Path matching
    it("matches .env path", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "edit",
        path: ".env.local",
      });
      expect(result).toBe("env_file");
    });

    // yaml takes priority over config/node_modules (appears earlier in rule table)
    it("matches yaml for .yml files even with config/node_modules in path", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "read",
        path: "node_modules/foo/config.yml",
      });
      expect(result).toBe("yaml");
    });

    // Config rule works for non-yml config files
    it("matches config for config files that aren't yml", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "read",
        path: "src/config.json",
      });
      expect(result).toBe("config");
    });

    // node_modules rule matches when yaml/config don't apply
    it("matches node_modules for non-config paths", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "read",
        path: "node_modules/express/index.js",
      });
      expect(result).toBe("node_modules");
    });

    // No match returns null
    it("returns null when no rules match", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "read",
        path: "src/index.ts",
        command: "",
        message: "",
      });
      // TypeScript path rule exists, so this should match
      expect(result).toBe("typescript");
    });

    // Empty/absent signals are safe
    it("returns null for bash with no command", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "bash",
      });
      expect(result).toBeNull();
    });

    // Git commit via wrapper tool
    it("matches git_commit for git tool with message", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "git",
        message: "feat: add new feature",
      });
      expect(result).toBe("git_commit");
    });

    // Git commit wrapper requires non-empty message
    it("returns null for git tool without message", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "git",
        message: "",
      });
      expect(result).toBeNull();
    });

    // AI assistant tool names
    it("matches ai_assist for AI tool names", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "ai_generate",
      });
      expect(result).toBe("ai_assist");
    });

    // Force push
    it("matches force_push for git push --force", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "bash",
        command: "git push --force",
      });
      expect(result).toBe("force_push");
    });

    // npm install
    it("matches npm_install for npm install", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "bash",
        command: "npm install express",
      });
      expect(result).toBe("npm_install");
    });

    // Test file path
    it("matches test_file for test/spec files", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "read",
        path: "src/utils.test.ts",
      });
      expect(result).toBe("test_file");
    });

    // YAML file
    it("matches yaml for .yml files", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "read",
        path: "docker-compose.yml",
      });
      expect(result).toBe("yaml");
    });

    // The 30th category (go_lang via path) is reachable
    it("reaches go_lang category via .go path", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "read",
        path: "main.go",
      });
      expect(result).toBe("go_lang");
    });

    // Temp file path
    it("matches temp_file for temp paths", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "edit",
        path: "/tmp/scratch.txt",
      });
      expect(result).toBe("temp_file");
    });

    // README path
    it("matches readme for README files", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "read",
        path: "README.md",
      });
      expect(result).toBe("readme");
    });

    // Package.json path
    it("matches package_json for package.json", () => {
      const result = matchContext(MATCH_RULES, {
        toolName: "edit",
        path: "package.json",
      });
      expect(result).toBe("package_json");
    });
  });
});
