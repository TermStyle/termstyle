type Factory<T> = (...args: any[]) => T;
type AsyncFactory<T> = (...args: any[]) => Promise<T>;
type Constructor<T> = new (...args: any[]) => T;

interface ServiceDescriptor<T> {
  factory?: Factory<T> | AsyncFactory<T>;
  constructor?: Constructor<T>;
  instance?: T;
  singleton: boolean;
  dependencies?: string[];
}

export class Container {
  private services = new Map<string, ServiceDescriptor<any>>();
  private instances = new Map<string, any>();
  private resolving = new Set<string>();

  // Register a singleton service
  singleton<T>(name: string, factory: Factory<T> | Constructor<T>, dependencies?: string[]): this {
    this.register(name, factory, true, dependencies);
    return this;
  }

  // Register a transient service
  transient<T>(name: string, factory: Factory<T> | Constructor<T>, dependencies?: string[]): this {
    this.register(name, factory, false, dependencies);
    return this;
  }

  // Register a value
  value<T>(name: string, value: T): this {
    const descriptor = {
      instance: value,
      singleton: true
    } as ServiceDescriptor<T>;
    this.services.set(name, descriptor);
    this.instances.set(name, value);
    return this;
  }

  // Get a service
  get<T>(name: string): T {
    const instance = this.resolve<T>(name);
    if (instance instanceof Promise) {
      throw new Error(`Service '${name}' is async. Use getAsync() instead.`);
    }
    return instance;
  }

  // Get an async service
  async getAsync<T>(name: string): Promise<T> {
    return this.resolve<T>(name);
  }

  // Check if service exists
  has(name: string): boolean {
    return this.services.has(name);
  }

  // Create a child container
  createScope(): Container {
    const child = new Container();
    child.services = new Map(this.services);
    // Don't copy instances - child will create its own
    return child;
  }

  private register<T>(
    name: string, 
    factoryOrConstructor: Factory<T> | Constructor<T>, 
    singleton: boolean,
    dependencies?: string[]
  ): void {
    const descriptor = {
      singleton,
      dependencies
    } as ServiceDescriptor<T>;

    if (typeof factoryOrConstructor === 'function') {
      if (factoryOrConstructor.prototype && factoryOrConstructor.prototype.constructor === factoryOrConstructor) {
        descriptor.constructor = factoryOrConstructor as Constructor<T>;
      } else {
        descriptor.factory = factoryOrConstructor as Factory<T>;
      }
    }

    this.services.set(name, descriptor);
  }

  private resolve<T>(name: string): T | Promise<T> {
    // Check for circular dependencies
    if (this.resolving.has(name)) {
      throw new Error(`Circular dependency detected: ${Array.from(this.resolving).join(' -> ')} -> ${name}`);
    }

    // Check if already instantiated
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    const descriptor = this.services.get(name);
    if (!descriptor) {
      throw new Error(`Service '${name}' not found`);
    }

    // If instance is provided, use it
    if (descriptor.instance !== undefined) {
      return descriptor.instance;
    }

    this.resolving.add(name);

    try {
      let instance: T | Promise<T>;

      if (descriptor.factory) {
        instance = this.createFromFactory(descriptor.factory, descriptor.dependencies);
      } else if (descriptor.constructor) {
        instance = this.createFromConstructor(descriptor.constructor, descriptor.dependencies);
      } else {
        throw new Error(`Service '${name}' has no factory or constructor`);
      }

      // Handle async resolution
      if (instance instanceof Promise) {
        return instance.then(resolved => {
          if (descriptor.singleton) {
            this.instances.set(name, resolved);
          }
          this.resolving.delete(name);
          return resolved;
        });
      }

      if (descriptor.singleton) {
        this.instances.set(name, instance);
      }

      return instance;
    } finally {
      this.resolving.delete(name);
    }
  }

  private createFromFactory<T>(
    factory: Factory<T> | AsyncFactory<T>, 
    dependencies?: string[]
  ): T | Promise<T> {
    if (!dependencies || dependencies.length === 0) {
      return factory();
    }

    const deps = dependencies.map(dep => this.resolve(dep));
    
    // Check if any dependency is async
    if (deps.some(dep => dep instanceof Promise)) {
      return Promise.all(deps).then(resolved => (factory as any)(...resolved));
    }

    return (factory as any)(...deps);
  }

  private createFromConstructor<T>(
    constructor: Constructor<T>,
    dependencies?: string[]
  ): T {
    if (!dependencies || dependencies.length === 0) {
      return new constructor();
    }

    const deps = dependencies.map(dep => {
      const instance = this.resolve(dep);
      if (instance instanceof Promise) {
        throw new Error(`Constructor dependency '${dep}' cannot be async`);
      }
      return instance;
    });

    return new constructor(...deps);
  }

  // Dispose all singletons
  dispose(): void {
    for (const instance of this.instances.values()) {
      if (instance && typeof instance.dispose === 'function') {
        instance.dispose();
      }
    }
    this.instances.clear();
    this.services.clear();
  }
}

// Service locator pattern for global access
export class ServiceLocator {
  private static container: Container;

  static setContainer(container: Container): void {
    this.container = container;
  }

  static get<T>(name: string): T {
    if (!this.container) {
      throw new Error('Container not set in ServiceLocator');
    }
    return this.container.get<T>(name);
  }

  static async getAsync<T>(name: string): Promise<T> {
    if (!this.container) {
      throw new Error('Container not set in ServiceLocator');
    }
    return this.container.getAsync<T>(name);
  }
}

// Decorator for dependency injection
export function inject(...dependencies: string[]) {
  return function (target: any) {
    const original = target;

    // Create a new constructor function
    const newConstructor: any = function (...args: any[]) {
      const container = ServiceLocator['container'];
      if (container && args.length === 0) {
        const deps = dependencies.map(dep => container.get(dep));
        return new original(...deps);
      }
      return new original(...args);
    };

    // Copy prototype
    newConstructor.prototype = original.prototype;

    // Store dependencies metadata
    newConstructor.__dependencies = dependencies;

    return newConstructor;
  };
}

// Example usage with decorators
/*
@inject('logger', 'config')
class MyService {
  constructor(private logger: Logger, private config: Config) {}
}

container.singleton('logger', () => new Logger());
container.singleton('config', () => new Config());
container.singleton('myService', MyService, ['logger', 'config']);
*/