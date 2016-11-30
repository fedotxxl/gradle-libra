package com.tenlittleniggers.gradle

import groovy.util.logging.Slf4j
import org.gradle.api.InvalidUserDataException
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.apache.commons.io.FilenameUtils

@Slf4j
class LibraPlugin implements Plugin<Project> {

    private Project project
    private LibraPluginExtension lext

    void apply(Project project) {

        project.extensions.create("libra", LibraPluginExtension)

        this.project = project
        this.lext = project.libra

        project.task('libraUpdates') << {
            lext.libra.sort().each {
                def module = it.key
                def repoFolder = getRepoModuleFolder(module).parentFile
                if (repoFolder.exists()) {
                    def versions = repoFolder.listFiles().findAll { it.isDirectory() }.collect { it.name }
                    def localVersion = getModuleVersion(module)

                    def newerVersions = versions.findAll { repoVersion ->
                        return (compareVersions(repoVersion, localVersion) > 0)
                    }

                    if (newerVersions) log.warn "Module ${module}: local ${localVersion}, repo ${newerVersions}"
                }
            }
        }

        project.task('libraPullAll') << {
            pullModules('')
        }

        project.task('libraPull') << {
            def console = System.console()
            if (console) {
                def modules = console.readLine('> Pls provide comma separated modules to pull: ')
                if (modules) {
                    pullModules(modules)
                }
            } else {
                log.warn "Cannot get console"
            }
        }

        project.task('libraPush') << {
            lext.libra.each {
                def module = it.key
                def localPath = it.value

                def source = getModuleLocalFile(module, localPath)
                if (!source.exists()) {
                    log.warn "File ${source} doesn't exist"
                } else {
                    def target = getModuleRepoFile(module)

                    if (!target.parentFile.exists() && !target.parentFile.mkdirs()) {
                        log.warn("Cannot create directory for file ${target}")
                    } else {
                        if (isSameFileContent(source, target)) {
                            log.warn "Module ${module} hadn't been changed"
                        } else {
                            copyFile(source, target)
                            log.warn "File ${source.name} pushed to ${target.canonicalPath}"
                        }
                    }
                }
            }
        }
    }

    private pullModules(String modules) {
        def localModules
        if (!modules) {
            localModules = lext.libra.keySet()
        } else {
            localModules = modules.split(',').collect { it.trim() }.collect { module ->
                def localModule = lext.libra.entrySet().find { getModuleName(it.key) == module || getModuleFileName(it.key) == module}

                if (!localModule) {
                    log.warn "Cannot find local module ${module}"
                    return null
                } else {
                    return localModule.key
                }
            }.findAll { it != null }
        }

        localModules.each { localModule ->
            def target = getModuleLocalFile(localModule, lext.libra[localModule])
            def source = getModuleRepoFile(localModule)

            if (!source.exists()) {
                log.warn "Repo file ${source} doesn't exist!"
            } else if (!target.parentFile.exists() && !target.parentFile.mkdirs()) {
                log.warn("Cannot create directory for file ${target}")
            } else {
                if (isSameFileContent(source, target)) {
                    log.warn "Module ${localModule} hadn't been changed"
                } else {
                    copyFile(source, target)
                    log.warn "Pulled file ${target.name} from ${source.canonicalPath}"
                }
            }
        }
    }

    private isSameFileContent(File source, File target) {
        return (source.exists() && target.exists() && source.text == target.text)
    }

    private copyFile(File source, File target) {
        //clear file
        target.delete()

        //copy content
        source.withInputStream { is ->
            target << is
        }

        //update last modified mark
        target.lastModified = source.lastModified()
    }

    private getModuleName(String module) {
        def moduleFileName = getModuleFileName(module)

        if (FilenameUtils.getExtension(moduleFileName) in lext.libraExtensions) {
            return FilenameUtils.removeExtension(moduleFileName)
        } else {
            return moduleFileName
        }
    }

    private getModuleFileName(String module) {
        return module.split(':')[0]
    }

    private getModuleVersion(String module) {
        try {
            return module.split(':')[1]
        } catch (e) {
            throw new InvalidUserDataException("Can't get version of module ${module}")
        }
    }

    private File getModuleRepoFile(String module) {
        return new File(getRepoModuleFolder(module), getModuleFileName(module))
    }

    private File getRepoModuleFolder(String module) {
        return new File(libraFolder, getModuleName(module).replace(".", "/") + "/" + getModuleVersion(module))
    }

    private File getModuleLocalFile(String module, String parent) {
        return project.file(lext.libraRoot + parent + "/" + getModuleFileName(module))
    }

    private getLibraFolder() {
        def libraHome = System.getenv("LIBRA_REPO") ?: System.getProperty("user.home") + "/.libra/"
        return new File(libraHome)
    }

    private compareVersions(String v1, String v2) {
        return (v1 == v2) ? 0 : 1
    }
}
